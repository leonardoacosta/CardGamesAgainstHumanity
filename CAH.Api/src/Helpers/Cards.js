import fs from "fs";
import path from "path";

export default class Cards {
    static getPacks() {
        try {
            let result = [];
            const cardsPath = path.join(__dirname, '../Cards');
            const folders = fs.readdirSync(cardsPath);
            folders.forEach((folder) => {
                const fullPath = path.join(cardsPath, folder, "metadata.json");
                let metadata = fs.readFileSync(fullPath)
                result.push(JSON.parse(metadata))
            })
            return result;
        } catch (error) {
            console.log("Fuck")
        }
    }

    static getWhiteCards(sets) {
        try {
            let result = [];
            sets.forEach(value => {
                const cardsPath = path.join(__dirname, '../Cards/' + value + "/white.md.txt");
                var contents = fs.readFileSync(cardsPath, 'utf8').toString().split("\n");
                result = [...result, ...contents]
            })

            return result;

        } catch (error) {
            console.log("Fuck")
        }
    }

    static getBlackCards(sets) {
        try {
            let result = [];
            sets.forEach(value => {
                const cardsPath = path.join(__dirname, '../Cards/' + value + "/black.md.txt");
                var contents = fs.readFileSync(cardsPath, 'utf8').toString().split("\n");
                result = [...result, ...contents]
            })

            return result;

        } catch (error) {
            console.log("Fuck")
        }
    }
}