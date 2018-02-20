var pageEl = document.getElementById('page');
var formEl = document.getElementsByClassName('signIn-form')[0];
var buttonEl = document.getElementById('signUp');
var blur = buttonEl.addEventListener("click", function(){
  console.log('cllickd');
  pageEl.style.transition = '2s'
  pageEl.style.filter = 'blur(10px)';
  pageEl.style.WebkitFilter = "blur(10px)";

  pageEl.style.transition = '2s'
  formEl.style.filter = 'blur(10px)';
  formEl.style.WebkitFilter = "blur(10px)";
  formEl.style.display = "block";
  formEl.style.filter = '';
  formEl.style.WebkitFilter = '';
})
