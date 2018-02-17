var pageEl = document.getElementById('page');
var signUpEl = document.getElementById('signUpPage');
var buttonEl = document.getElementById('signUp');
var blur = buttonEl.addEventListener("click", function(){
  console.log('cllickd');
  pageEl.style.backgroundColor = 'lightgrey';
  pageEl.style.transition = '1s'
  pageEl.style.opacity = '0.3';
  signUpEl.style.display = "block";

})
