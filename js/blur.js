var bodyEl = document.getElementsByTagName('body')[0];
var accountEl = document.getElementById('signUp');
var blur = accountEl.addEventListener("click", function(){
  bodyEl.blur();
})
