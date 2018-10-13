window.onload = function(){

	var quillEditor = new Quill('#editor', {
		modules: {
			toolbar: [
				[{ header: [1, 2, false] }],
				['bold', 'italic', 'underline'],
				['code-block']
			],
			'auto-links': {
				paste: true,
				type: true
			}
		},
		theme: 'snow'
	});

	function addError(html) {
		$("#formCol").prepend(`<div style="margin-bottom: 2rem;" class="alert alert-danger">${html}</div>`);
	}

	$('#feedbackForm').submit(function() {
		event.preventDefault();

		$(".alert").remove();
		if (!$("#agreementCheck").prop('checked'))
			addError("Please <strong>check off</strong> the agreement");
		if (quillEditor.getContents().ops[0].insert == "\n")
			addError("Please enter a <strong>description</strong>");
		if (!$('#subject').val())
			addError("Please enter a <strong>subject</strong>");
		if (!$('#email').val())
			addError("Please enter your <strong>email</strong>");
		if (!$('#name').val())
			addError("Please enter your <strong>name</strong>");
		if ($(".alert-danger").length > 0)
			return false;

		$('#submit').prop('disabled', true);

		var description = JSON.stringify(quillEditor.getContents().ops);

		var formData = new FormData();
		for (var i = 0; i < $('input[type=file]')[0].files.length; i++) {
		  formData.append('file', $('input[type=file]')[0].files[i]);
		}
		formData.append('name', $('#name').val());
		formData.append('email', $('#email').val());
		formData.append('subject', $('#subject').val());
	    formData.append('description', description);

		$.ajax({
			url: "/contact",
			data: formData,
			type: 'POST',
			contentType: false,
			processData: false,
			success: function(feedbackSuccessful) {
				if (feedbackSuccessful) {
					$('#feedbackForm').trigger("reset");
					quillEditor.setContents([{insert: '\n'}]);
					$("#formCol").prepend('<div style="margin-bottom: 2rem;" class="alert alert-success">Your feedback has been received ✔️</div>');
				}
				$('#submit').prop('disabled', false);
			}
		});

	});
};
