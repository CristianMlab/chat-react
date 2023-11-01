const mysql = require('mysql');

const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'parola123'
});

exports.execQuery = async (query, data=[])=>{
    try {
        return new Promise((resolve,reject)=>{
            conn.query(query, data, (error, results) => {
                if (error) {
                    console.error('Error executing MySQL query:', error);
                    return reject(error);
                }
                resolve(results)
            });
        })
    } catch (error) {
        console.log(error)
    }
}

exports.getCurrentTime = () => {
    const now = new Date();
    const currentTime = now.toISOString().slice(0, 19).replace('T', ' ');
    return currentTime;
};