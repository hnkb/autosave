autosave
========

A JavaScript library that automatically saves HTML forms in the background. This library uses *jQuery*.
It is unobstrusive, if JavaScript is not enabled on client browser the form will act like a normal
HTML form.


## Basic usage

Add `class="Autosave"` to every form in your page that you wish to be saved automatically in the
background. Then insert `<script type="text/javascript" src="autosave.js"></script>` at the bottom of
your HTML page. This script automatically hides any submit buttons for those forms when it's activated.

The code only sends fields that are actually changed (not every field in the form), so in server-side
you must check if a field exists in form data: _if yes_ update your database, _if no_ do not change that
field's value in the database. You must include any values necessary for your server-side page (like
record id) in form's `action` url to be sure they are sent with every request (instead of using
`<input type="hidden" />`).

Also, your server side code must return an HTTP error code (403, 404, 500) in case of error, not an
HTML message. The script sends a `Timestamp` value with every request it sends, so server-side code can
ignore requests with older timestamp values if a newer request is already received. A user session
variable is usually a good place to track these timestamp values. (Tracking request timestamp is not
necessary, because the script only sends one request at a time for each form and waits for old request
to complete before sending a new one, but I've put it there just to be sure!)


## How does it work

This script works with every `<form>` element in the page. At form load, it checks every form field
and saves their values in a variable. Later, it compares field values with these original values to
determine which form fields are changed.

When any input element is changed, the script creates a 2s timeOut (in order to let user type, and
aggregate a few changes together) and then compares new form values with old ones, and sends the
different fields using an Ajax request to every form's `action`.

If user tries to close window (or navigate away form page) the script shows a warning message that
the form data has changed (for every POST form, not only just `class="Autosave"` forms; You should use
`method="get"` for forms that don't change database state -- like search forms).

You can have as many forms in your page as you require. This script keeps track of every form separately
and sends a different Ajax request for each different form. You can also mix and match autosave and
normal forms in a single page.


## Customizations

You can add an element (`span`, `div`, `p`) with `class="AutosaveMessages"` to your forms. This element will
display autosave status (or error) messages. The code will attach `class="Pending"` to this element
when a request is pending and attach `class="Error"` if a request has failed. You can customize your
CSS styles for these classes.

This script automatically sends user data to server every 2 seconds. If you want your users to issue
saves immediately, you can put a Save button on your form (this can be a `button`, `input`, `a`) with
`class="Save"`. If user clicks on this button, the data will be sent using Ajax. If user clicks on a
normal "submit" input, the data will be sent using a normal HTTP request (no Ajax and not in the
background).

If you want to hide all messages and buttons when form is up-to-date, you can put all these elements in
a container element with `class="AutosavePopup"`. This element will be shown or hidden as necessary by
this script.

So a complete form footer would look something like this:
    <p class="AutosavePopup">
        <span class="AutosaveMessages"></span>
        <a href="#" class="Save" style="display:none">Save</a>
        <input type="submit" value="Save without Ajax" />
    </p>

This script acts unobstrusively but has one glitch. It reads original form values at page load. If user
changes form values before the page is fully loaded and script is run, these changes would not be "seen"
by the script. To fix this problem unobstrusively, you shall disable forms with a small JavaScript snippet
before any input is displayed, and enable it after `autsave.js` is loaded. Like this:
    <div
        id="load-wait"
        style="position: fixed; left: 0; right: 0; top: 0; bottom: 0; background: rgba(0,0,0,.6); display: none">
    </div>
    <script>$('#load-wait').show();</script>
    
    <form class="Autosave">
        <!-- your actual fields -->
        <!-- your autosave popup including Save button, per above example -->
    </form>
    <script type="text/javascript" src="autosave.js"></script>
    <script type="text/javascript">$('#load-wait').fadeOut();</script>


## Known issues

- There is no way of customizing behaviour, like the timeout of 2s, at the moment (except manually
  changing these values in `autosave.js`. Messages are all in Persian (there are 4 messages in total).

- There is no way to disable Automatic background saving and just keep Ajax save button.

- This library depends on `JSON` object. For older browsers (IE7) you must include `json2.js` in your
  page.

