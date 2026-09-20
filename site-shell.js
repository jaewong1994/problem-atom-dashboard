// Native details keeps secondary routes usable without JavaScript.
const more=document.querySelector('.nav-more');
if(more){
  document.addEventListener('click',event=>{if(!more.contains(event.target))more.open=false;});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&more.open){more.open=false;more.querySelector('summary').focus();}});
  more.addEventListener('focusout',event=>{if(event.relatedTarget&&!more.contains(event.relatedTarget))more.open=false;});
}
