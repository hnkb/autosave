
// Requires jQuery

(function () {
    function getSerializedArray(form) {
        var r = {}, s = $(form).serializeArray();
        for (var i = 0; i < s.length; i++) {
            /* this is to detect multiple inputs with the same name (checkboxes, etc.) */
            var val = $.trim(s[i].value);
            if (r[s[i].name]) {
                if ($.isArray(r[s[i].name]))
                    r[s[i].name].push(val);
                else
                    r[s[i].name] = [r[s[i].name], val];
            } else
                r[s[i].name] = val;
        }
        return r;
    }

    function findChangedValues(form, formData) {
        var r = {};

        for (key in formData)
            /* we use JSON.stringify to compare arrays correctly too */
            if (!form.lastSavedValues.hasOwnProperty(key) || JSON.stringify(form.lastSavedValues[key]) != JSON.stringify(formData[key]))
                r[key] = formData[key];

        for (key in form.lastSavedValues)
            if (!formData.hasOwnProperty(key))
                r[key] = [];

        return r;
    }

    function hasUnsavedChanges(form) {
        return !$.isEmptyObject(findChangedValues(form, getSerializedArray(form)));
    }

    window.onbeforeunload = function (e) {
        var dirty = false, autosave = false;

        // don't check search form changes, so only select POST forms
        $('form[method=post]').each(function () {
            autosave = $(this).hasClass('Autosave');
            return !(dirty = !this.IsSubmitting && hasUnsavedChanges(this));
        });

        if (dirty) return autosave ?
            "آخرین تغییرات شما ذخیره نشده. در صورتی که این صفحه را ببندید این تغییرات از بین خواهد رفت.\nلطفاً در صورتی که مایل به حفظ این تغییرات هستید کمی صبر کنید تا سیستم به صورت اتوماتیک تغییرات شما را ثبت کند یا از دکمه‌ی «ثبت» یا «ادامه» استفاده کنید."
            : "آخرین تغییرات شما ذخیره نشده. در صورتی که این صفحه را ببندید این تغییرات از بین خواهد رفت.\nلطفاً در صورتی که مایل به حفظ این تغییرات هستید از دکمه‌ی «ثبت» یا «ادامه» استفاده کنید.";
    };

    $(document).ajaxError(function (ev, x, s, e) {
        $('form.Autosave').each(function () {
            if (this.autosaveXHR == x && hasUnsavedChanges(this)) {
                $('.AutosavePopup').addClass('Error').slideDown();
                $(this).find('.AutosaveMessages').text('خطا در ذخیره کردن تغییرات: ' + e).removeClass('Pending');
                $(this).find('input:submit').fadeIn();
                registerAutosaveTimeout();
            }
        });
    });

    function hideSaveButtons() {
        var dirty = false;
        $('form[method=post]').each(function () { return !(dirty = hasUnsavedChanges(this)); });
        if (!dirty) {
            $('.AutosavePopup').removeClass('Error').slideUp();
            $('.Save').fadeOut();
        }
    }

    function AjaxSave() {
        $('form.Autosave').each(function () {
            if (this.autosaveXHR && this.autosaveXHR.readyState != 4) {
                // an earlier update is pending, so don't update again
                // but remember to update as soon as this one finished

                // we can also abort any pending update and send request again
                //$(this).find('.AutosaveMessages').text('درخواست ذخیره‌ی دیگری در حال انجام است');
                return;
            }

            var currentValues = getSerializedArray(this);
            var diff = findChangedValues(this, currentValues);

            if (!$.isEmptyObject(diff)) {
                var form = this;
                diff.Timestamp = new Date().getTime();
                //window.alert(JSON.stringify(diff));

                $('.AutosavePopup').slideDown();//.removeClass('Error');
                $(form).find('.AutosaveMessages').text('در حال ذخیره کردن تغییرات...').addClass('Pending');

                form.autosaveXHR = $.post($(this).attr('action'), $.param(diff), function (data, textStatus, jqXHR) {
                    //window.alert(JSON.stringify(data));
                    //if (form.autosaveXHR == jqXHR) delete form.autosaveXHR;
  				if (!form.lastAutosaveTimestamp || form.lastAutosaveTimestamp < diff.Timestamp) {
						form.lastAutosaveTimestamp = diff.Timestamp;
						form.lastSavedValues = currentValues;
						if (!hasUnsavedChanges(form)) {
							$(form).find('.AutosaveMessages').text('').removeClass('Pending');
							$(form).find('input:submit').fadeOut();
							hideSaveButtons();
						} else {
							registerAutosaveTimeout();
						}
					}/* else {
						// another more recent request has already been received, throw this one away
					}*/
                });
            } else {
                $(this).find('input:submit').fadeOut();
                hideSaveButtons();
            }
        });
        return false;
    }

    $('.Save').click(AjaxSave);

    var autosaveTimeout;
    function registerAutosaveTimeout() {
        if (!autosaveTimeout) autosaveTimeout = setTimeout(function () {
            autosaveTimeout = null;
            AjaxSave();
        }, 2000);
    }

    $('form[method=post]').each(function () { if (!this.lastSavedValues) this.lastSavedValues = getSerializedArray(this); });
    $(document).on('submit', 'form', function () { this.IsSubmitting = true; });
    $(document).on('change input', 'form.Autosave', function () { registerAutosaveTimeout(); $('.AutosavePopup').slideDown(); $('.Save').fadeIn(); });

    $('form.Autosave .AutosavePopup').hide();
    $('.Save').hide();
    $('form.Autosave input:submit').hide();

    // show a hint that Autosave is enabled
    // on form change for those without autosave: "this will not auto save, you have to press save button"

})();
