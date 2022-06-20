var commonFun = {
    dateFormat: function (dt) {
        //2022-03-31UTC16:58:04+05:30
        var t = new Date(dt);

        const date = ('0' + t.getDate()).slice(-2);
        const month = ('0' + (t.getMonth() + 1)).slice(-2);
        const year = t.getFullYear();
        const hours = ('0' + t.getHours()).slice(-2);
        const minutes = ('0' + t.getMinutes()).slice(-2);
        const seconds = ('0' + t.getSeconds()).slice(-2);
        var n = t.getDate();
        const ordinalNum = n + (n > 0 ? ['th', 'st', 'nd', 'rd'][(n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10] : '');
        let shortMonth = t.toLocaleString('en-us', { month: 'short' });
        let ampm = t.getHours() >= 12 ? 'PM' : "AM";
        var final = `${year}-${month}-${date}UTC${hours}:${minutes}:${seconds}+05:30`;
        //console.log(final);
        //console.log('dt', t.getFullYear(), ordinalNum, `${ordinalNum} ${shortMonth}, ${year}, ${hours}:${minutes} ${ampm}`);
        return final;
    }
};

module.exports.commonFun = commonFun;