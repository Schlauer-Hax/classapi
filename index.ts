import express from 'express';
import xml2json from 'xml2json';

const id = "";
const password = "";
const classid = "10/2";

function getClassData() {
    return new Promise((resolve) => {
    const url = `https://www.stundenplan24.de/${id}/mobil/mobdaten/PlanKl${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}.xml`;
    fetch(url, {
        method: 'GET',
        headers: {
            'Host': 'www.stundenplan24.de',
            'Authorization': 'Basic ' + Buffer.from("schueler:"+password).toString('base64'),
            'Accept': '*/*',
        }
    }).then((response: any) => response.text()).then((data: any) => {
        //res.type('application/xml');

        const dataobj = JSON.parse(xml2json.toJson(data));
        const output = dataobj['VpMobil']['Klassen']['Kl'].filter((kl: any) => kl['Kurz']===classid)[0]
        resolve(output);
    })
})
}

const app = express();

app.get('/', (req, res) => {
    getClassData().then((data: any) => {
        res.send(data);
    });
});

const timedata = [
    '7:30',
    '8:25',
    '9:25',
    '10:10',
    '11:15',
    '12:10',
    '13:35',
    '14:20'
]

function nextClass(data: any) {
    const number = timedata.indexOf(timedata.find((t: any) => {
        const time = new Date();
        time.setHours(t.split(':')[0], t.split(':')[1]);
        return new Date() < time
    })!) + 1;
    return data['Pl']['Std'].filter((st: any) => st['St'] == number);
}

app.get('/next', (req, res) => {
    getClassData().then((data: any) => {
        const next = nextClass(data);
        let output: string;
        if (next.length == 0 ) {
            output = 'Keine Stunden gefunden.';
        } else if (next.length == 1) {
            output = `Deine nächste Stunde ist ${next[0]['Fa']} im Raum ${next[0]['Ra']}. Die Stunde beginnt um ${timedata[number-1]} Uhr.`;
        } else {
            output = 'Ich habe mehrere Stunden gefunden. ';
            next.forEach((hour, index) => {
                output += `${hour['Fa']} im Raum ${hour['Ra']}${(index+2)==next.length ? ' und': ','} `;
            });
            output += `Die Stunden beginnen um ${timedata[number-1]} Uhr.`;
        }
        res.send(output);
    });
})

app.get('/data/next', (req, res) => {
    getClassData().then((data: any) => {
        res.send(nextClass(data));
    });
})

app.listen(4200);