let quillEditor = new Quill('#editor', {
  theme: 'snow',
  modules: {
    toolbar: false
  }
});

var myDoc =
{
  answer: []
}

quillEditor.on('text-change', function(){
  console.clear();
  console.log(myDoc.answer);
  myDoc.answer = quillEditor.getContents();
});

quillEditor.disable();
// quillEditor.setContents(myDoc.answer);
