var pageEl = document.getElementById('page');
var signUpEl = document.getElementById('login');
var buttonEl = document.getElementById('signUp');
var blur = buttonEl.addEventListener("click", function(){
  console.log('cllickd');
  pageEl.style.transition = '2s'
  pageEl.style.filter = 'blur(10px)';
  pageEl.style.WebkitFilter = "blur(10px)";
  //signUpEl.style.display = "block";

})
