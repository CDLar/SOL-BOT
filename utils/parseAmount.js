module.exports.parseAmount = (match) => {
    let amount = parseFloat(match[2].replace(/,/g, ''));
    if (match[3]) amount *= 1000; // Handle 'k' for thousands
    return Math.round(amount);
};
