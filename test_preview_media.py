"""Image-transfer regressions; native share targets are never opened by tests."""
import json
import subprocess
import unittest
from pathlib import Path
from test_connections import NODE

ROOT = Path(__file__).resolve().parent


class PreviewMediaTests(unittest.TestCase):
    def run_js(self, scenario):
        source = (ROOT / 'app.js').read_text(encoding='utf-8')
        source = source[source.index('let previewRevision ='):source.index('async function refreshData()')]
        harness = r'''
const vm = require('node:vm'), assert = require('node:assert/strict');
const elements = {
  '#sharePreview': {hidden:true, disabled:true}, '#copyPreview': {},
  '#downloadPreview': {hidden:false}, '#previewCopyStatus': {},
  '#previewImage': {complete:true, naturalWidth:828, naturalHeight:947}
};
const png = new Blob(['sample png'], {type:'image/png'});
let calls = [], blobCallbacks = [], delayed = false;
const navigator = {
  canShare: ({files}) => files[0].type === 'image/png',
  share: data => {calls.push(data); return Promise.resolve();},
  clipboard: {write: async () => {}}
};
const context = vm.createContext({
  $: key => elements[key], navigator, File,
  ClipboardItem: class {constructor(data){this.data=data;}},
  window: {isSecureContext:true, ClipboardItem:class{}},
  document: {createElement: () => ({
    getContext: () => ({drawImage(){}}),
    toBlob: cb => delayed ? blobCallbacks.push(cb) : cb(png)
  })}
});
vm.runInContext(SOURCE + `
globalThis.api = {preparePreviewShare, sharePreviewImage, copyPreviewImage,
  next(){++previewRevision;previewShareFile=null;},
  revision(){return previewRevision;}};`, context);
const api = context.api;
(async()=>{SCENARIO})().catch(error=>{console.error(error);process.exit(1);});
'''.replace('SOURCE', json.dumps(source)).replace('SCENARIO', scenario)
        result = subprocess.run([NODE, '-e', harness], cwd=ROOT, capture_output=True, text=True, encoding='utf-8')
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_share_uses_prepared_png_and_can_retry_after_cancel(self):
        self.run_js(r'''
await api.preparePreviewShare(0,'problem.png');
assert.equal(elements['#sharePreview'].hidden,false);
navigator.share = data => {calls.push(data);return Promise.reject({name:'AbortError'});};
await api.sharePreviewImage();
assert.equal(elements['#sharePreview'].disabled,false);
assert.ok(elements['#previewCopyStatus'].textContent.includes('공유를 마치지'));
navigator.share = data => {calls.push(data);return Promise.resolve();};
await api.sharePreviewImage();
assert.equal(calls.length,2);
assert.equal(calls[1].files[0].name,'problem.png');
assert.equal(await calls[1].files[0].text(),await png.text());
assert.equal(elements['#downloadPreview'].hidden,false);
''')

    def test_old_image_and_share_completion_do_not_leak_to_new_question(self):
        self.run_js(r'''
delayed = true;
const pending = api.preparePreviewShare(0,'old.png');
api.next();blobCallbacks.shift()(png);await pending;
assert.equal(elements['#sharePreview'].hidden,true);
delayed = false;
await api.preparePreviewShare(1,'current.png');
let complete;
navigator.share = () => {calls.push(true);return new Promise(resolve=>complete=resolve);};
const sharing = api.sharePreviewImage();
await api.sharePreviewImage();assert.equal(calls.length,1);
api.next();elements['#previewCopyStatus'].textContent='new question';
complete();await sharing;
assert.equal(elements['#previewCopyStatus'].textContent,'new question');
assert.equal(elements['#sharePreview'].disabled,true);
''')

    def test_unsupported_share_and_clipboard_denial_keep_save_available(self):
        self.run_js(r'''
navigator.canShare = () => false;
await api.preparePreviewShare(0,'problem.png');
assert.equal(elements['#sharePreview'].hidden,true);
await api.sharePreviewImage();assert.equal(calls.length,0);
navigator.clipboard.write = () => Promise.reject({name:'NotAllowedError'});
await api.copyPreviewImage();
assert.ok(elements['#previewCopyStatus'].textContent.includes('권한이 차단'));
assert.equal(elements['#copyPreview'].disabled,false);
assert.equal(elements['#downloadPreview'].hidden,false);
navigator.clipboard.write = () => Promise.resolve();
await api.copyPreviewImage();
assert.ok(elements['#previewCopyStatus'].textContent.includes('복사했습니다'));
assert.equal(elements['#downloadPreview'].hidden,false);
''')


if __name__ == '__main__':
    unittest.main()
