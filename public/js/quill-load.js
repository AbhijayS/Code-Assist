window.onload = function(){
  // Your code here
  var postViewEditor = new Quill('#post-view-editor', {
    modules: {
      toolbar: false
    },
    theme: 'snow'
  });

  console.log("Community description: " + typeof {{{description}}});
  postViewEditor.setContents({{{description}}});
  postViewEditor.disable();
};
