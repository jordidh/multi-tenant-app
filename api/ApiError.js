class ApiError {
    constructor (code, message, detail, help) {
        this.code = code;
        this.message = (message || '');
        this.detail = (detail || '');
        this.help = (help || '');
    }
}

module.exports = ApiError;
