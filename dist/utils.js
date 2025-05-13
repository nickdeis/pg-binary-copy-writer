export function chunk(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size)
        result.push(array.slice(i, i + size));
    return result;
}
export function flatten(arr) {
    return arr.reduce((acc, val) => Array.isArray(val) ? acc.concat(flatten(val)) : acc.concat(val), []);
}
