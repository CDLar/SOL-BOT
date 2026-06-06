module.exports.parseAmount = (match) => {
    let raw = match[2];
    // Comma before 1-2 trailing digits = decimal separator (e.g. 23,5 → 23.5)
    raw = raw.replace(/,(\d{1,2})$/, '.$1');
    // Strip remaining commas used as thousands separators (e.g. 1,500)
    raw = raw.replace(/,/g, '');
    let amount = parseFloat(raw);
    if (match[3]) amount *= 1000;
    return Math.round(amount);
};
