var editor;

function contentToolsInit(){
 // 	ContentTools.StylePalette.add([
	// 	new ContentTools.Style('Black Font', 'black', ['h1'])
	// ]);

	editor = ContentTools.EditorApp.get();
	editor.init('*[data-editable]', 'data-name');

	editor.addEventListener('saved', function (ev) {
		var regions;

		// Check that something changed
		regions = ev.detail().regions;
		if (Object.keys(regions).length == 0) {
			return;
		}

		// Set the editor as busy while we save our changes
		this.busy(true);
	});
}

// Send the update content to the server to be saved
function contentToolChangeState(bool) {
    editor.busy(false);
    if (bool) {
        new ContentTools.FlashUI('ok');
    } else {
        new ContentTools.FlashUI('no');
    }
};
