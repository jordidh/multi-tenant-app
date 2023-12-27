/**
 * This function validates the password input from the form. In case it doesn't pass,
 * it shows an element with the message and scrolls to top of the window.
 * @param patternPassword it's the same regular expression from the server
 * returns false if it doesn't pass and true if it passes.
 */
// eslint-disable-next-line no-unused-vars
function validateRegister (patternPassword, PASSNOTEQUAL, ERRORPATTERNPASS) {
    const REG_EXP_PASSWORD = new RegExp(patternPassword);
    const errorBox = document.getElementById('errorbox2');
    const passwordValue = document.forms.registerForm.password1.value;
    const passwordValue2 = document.forms.registerForm.password2.value;

    if (passwordValue !== passwordValue2) {
        errorBox.innerHTML = PASSNOTEQUAL;
        errorBox.style.visibility = 'visible';
        scrollToTop();
        return false;
    } else if (!REG_EXP_PASSWORD.test(passwordValue)) {
        errorBox.innerHTML = ERRORPATTERNPASS;
        errorBox.style.visibility = 'visible';
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
    const errorBox = document.getElementById('errorbox');
    const errorBox2 = document.getElementById('errorbox2');

    if (errorBox) {
        errorBox.style.visibility = 'hidden';
    }
    if (errorBox2) {
        errorBox2.style.visibility = 'hidden';
    }
}
