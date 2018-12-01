export const prepare = (o) => {
    if (!o) return null;
    o._id = o._id.toString();
    return o;
}