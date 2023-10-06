/**
 * @swagger
 *   definitions:
 *     ApiResult:
 *       additionalProperties: true
 *       type: "object"
 *       properties:
 *         status:
 *           type: "integer"
 *         data:
 *           type: "array"
 *           items:
 *             type: "object"
 *             description : "array of objects returned"
 *         requestId:
 *           type: "string"
 *         errors:
 *           type: "array"
 *           items:
 *             type : "object"
 *             description : "name of the object"
 *             properties:
 *               code:
 *                 type: "string"
 *               message:
 *                 type: "string"
 *               detail:
 *                 type: "string"
 *               help:
 *                 type: "string"
 *       required: ["status","data","requestedId", "errors"]
 */
class ApiResult {
    /**
   *
   * @param {*} status
   * @param {*} data
   * @param {*} requestedId
   * @param {*} error : object from class ApiError
   */
    constructor (status, data, requestId, errors) {
        this.status = status;
        this.data = data;
        this.requestId = requestId;
        this.errors = [];

        if (errors && Array.isArray(errors)) {
            this.errors = [...this.errors, ...errors];
        }
    }
}

module.exports = ApiResult;
