/**
 * This function validates the password input from the form. In case it doesn't pass,
 * it shows an element with the message and scrolls to top of the window.
 * @param patternPassword it's the same regular expression from the server
 * returns false if it doesn't pass and true if it passes.
 */
// eslint-disable-next-line no-unused-vars
function validateRegister (patternPassword) {
    const REG_EXP_PASSWORD = new RegExp(patternPassword);
    const ERRORBOX = document.getElementById('errorbox2');
    const PASSWORD = document.forms.registerForm.password1.value;
    const PASSWORD2 = document.forms.registerForm.password2.value;

    if (PASSWORD !== PASSWORD2) {
        ERRORBOX.innerHTML = 'Passwords are not equal';
        ERRORBOX.style.visibility = 'visible';
        scrollToTop();
        return false;
    } else if (!REG_EXP_PASSWORD.test(PASSWORD)) {
        ERRORBOX.innerHTML = 'Error the password must have: 8 characters, one lowercase letter, one uppercase letter, one digit and one character: @$!%*#?&^';
        ERRORBOX.style.visibility = 'visible';
        scrollToTop();
        return false;
    }
    return true;
}

function scrollToTop () {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}
// eslint-disable-next-line no-unused-vars
function hide () {
    const ERRORBOX = document.getElementById('errorbox');
    const ERRORBOX2 = document.getElementById('errorbox2');

    if (ERRORBOX) {
        ERRORBOX.style.visibility = 'hidden';
    }
    if (ERRORBOX2) {
        ERRORBOX2.style.visibility = 'hidden';
    }
}
