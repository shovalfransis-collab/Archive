import AddPage from '../add/page';

// Never cache: every visit is a new thing to save.
export const dynamic = 'force-dynamic';

// /share?title=…&text=…&url=… — where Android (and desktop Chrome) send
// things when you pick "The Archive" in the share menu, once the app is
// installed. The address and parameter names are set by `share_target` in
// app/manifest.js. It works exactly like /add.
export default AddPage;
