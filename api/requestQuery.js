// ?skip=0&limit=2&filter=id:gt:3,code:eq:abc&sort=id:desc
const DEFAULT_SKIP = 0;
const DEFAULT_LIMIT = 150;
module.exports = {

    /**
   * Returns the pagination specified in the request.query  or a default
   * pagination object.
   * @param {*} query
   * @returns
   */
    pagination: function (query) {
        if (query && query.skip && query.limit && query.limit > 0) {
            return { skip: query.skip, limit: query.limit };
        } else if (query && query.skip) {
            return { skip: query.skip, limit: DEFAULT_LIMIT };
        } else if (query && query.limit && query.limit > 0) {
            return { skip: DEFAULT_SKIP, limit: query.limit };
        } else {
            return { skip: DEFAULT_SKIP, limit: DEFAULT_LIMIT };
        }
    },

    filter: function (query) {
        if (query && query.filter) {
        // && !query.filter.match(/^[a-zA-Z0-9_]+:(eq|neq|gt|gte|lt|lte|like|nlike|in|nin):[a-zA-Z0-9_,]+$/)
            if (typeof query.filter !== 'string') {
            // error
                throw new Error('Error invalid filter parameter.');
            } else {
                const segments = query.filter.split(',');
                const avitableFilters = segments.map(segment => {
                    const [property, rule, value] = segment.split(':');
                    return { property, rule, value };
                });
                return avitableFilters;
            }
        } else {
            return null;
        }
    },

    sort: function (query) {
        if (query && query.sort) {
            const segments = query.sort.split(',');
            const avitableSort = segments.map(segment => {
                const [property, order] = segment.split(':');
                return { property, order };
            });
            return avitableSort;
        } else {
            return null;
        }
    },

    /**
   * Returns a string with the mysql limit
   * @param {*} pag : object with the skip and limit, can not be null
   * @returns
   */
    getLimit: function (pag) {
        return `LIMIT ${pag.skip},${pag.limit}`;
    },

    getWheres: function (filter) {
        if (filter) {
            let sql = 'WHERE ';
            for (let i = 0; i < filter.length; i++) {
                if (i !== 0) sql += ' AND ';
                sql += getWhere(filter[i]);
            }
            return sql;
        } else {
            return '';
        }
    },

    getOrderBy: function (sort) {
        if (sort) {
            let sql = 'ORDER BY ';
            for (let i = 0; i < sort.length; i++) {
                if (i !== 0) sql += ', ';
                sql += sort[i].property + ' ' + sort[i].order;
            }
            return sql;
        } else {
            return '';
        }
    }
};

const FilterRule = {
    EQUALS: 'eq',
    NOT_EQUALS: 'neq',
    GREATER_THAN: 'gt',
    GREATER_THAN_OR_EQUALS: 'gte',
    LESS_THAN: 'lt',
    LESS_THAN_OR_EQUALS: 'lte',
    LIKE: 'like',
    NOT_LIKE: 'nlike',
    IN: 'in',
    NOT_IN: 'nin',
    IS_NULL: 'isnull',
    IS_NOT_NULL: 'isnotnull'
};

const getWhere = function (filter) {
    if (filter.rule === FilterRule.IS_NULL) return `${filter.property} IS NULL`;
    else if (filter.rule === FilterRule.IS_NOT_NULL) return `${filter.property} IS NOT NULL`;
    else if (filter.rule === FilterRule.EQUALS) return `${filter.property} = ${filter.value}`;
    else if (filter.rule === FilterRule.NOT_EQUALS) return `${filter.property} != ${filter.value}`;
    else if (filter.rule === FilterRule.GREATER_THAN) return `${filter.property} > ${filter.value}`;
    else if (filter.rule === FilterRule.GREATER_THAN_OR_EQUALS) return `${filter.property} >= ${filter.value}`;
    else if (filter.rule === FilterRule.LESS_THAN) return `${filter.property} < ${filter.value}`;
    else if (filter.rule === FilterRule.LESS_THAN_OR_EQUALS) return `${filter.property} <= ${filter.value}`;
    else if (filter.rule === FilterRule.LIKE) return `${filter.property} LIKE '${filter.value}'`;
    else if (filter.rule === FilterRule.NOT_LIKE) return `${filter.property} NOT LIKE '${filter.value}'`;
    else if (filter.rule === FilterRule.IN) return `${filter.property} IN (${filter.value.split(',')})`;
    else if (filter.rule === FilterRule.NOT_IN) return `${filter.property} NOT IN (${filter.value.split(',')})`;
};
