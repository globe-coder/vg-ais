const puppeteer = require('puppeteer');
const fs = require('fs');

// Tableau des bateaux avec nom et MMSI
const boats = [
    { name: "Fabrice AMEDEO (Nexans - Wewise)", mmsi: "228161080" },
    { name: "Romain ATTANASIO (Fortinet - Best Western)", mmsi: "227396550" },
    { name: "Eric BELLION (STAND AS ONE)", mmsi: "228165920" },
    { name: "Yannick BESTAVEN (Maître CoQ V)", mmsi: "228135630" },
    { name: "Jérémie BEYOU (Charal)", mmsi: "228120110" },
    { name: "Arnaud BOISSIÈRES (La Mie Câline)", mmsi: "228351700" },
    { name: "Louis BURTON (Bureau Vallée)", mmsi: "227970220" },
    { name: "Conrad COLMAN (MS Amlin)", mmsi: "228279600" },
    { name: "Antoine CORNIC (Human Immobilier)", mmsi: "227977350" },
    { name: "Manuel COUSIN (Coup de Pouce)", mmsi: "228264900" },
    { name: "Clarisse CRÉMER (L’Occitane en Provence)", mmsi: "256003485" },
    { name: "Charlie DALIN (MACIF Santé Prévoyance)", mmsi: "228177430" },
    { name: "Samantha DAVIES (Initiatives-Cœur)", mmsi: "228115260" },
    { name: "Violette DORANGE (DeVenir)", mmsi: "228269600" },
    { name: "Louis DUC (Fives Group - Lantana Environnement)", mmsi: "228254800" },
    { name: "Benjamin DUTREUX (GUYOT environnement – Water Family)", mmsi: "228101590" },
    { name: "Benjamin FERRÉ (Monnoyeur - Duo for a Job)", mmsi: "228014600" },
    { name: "Sam GOODCHILD (VULNERABLE)", mmsi: "227957240" },
    { name: "Pip HARE (Medallia)", mmsi: "232037434" },
    { name: "Oliver HEER (Oliver Heer Ocean Racing)", mmsi: "228275600" },
    { name: "Boris HERRMANN (Malizia - Seaexplorer)", mmsi: "228131430" },
    { name: "Isabelle JOSCHKE (MACSF)", mmsi: "228278600" },
    { name: "Jean LE CAM (Tout commence en Finistère - Armor-lux)", mmsi: "228194260" },
    { name: "Tanguy LE TURQUAIS (Lazare)", mmsi: "228295700" },
    { name: "Nicolas LUNVEN (Holcim - PRB)", mmsi: "228125560" },
    { name: "Sébastien MARSSET (Foussier)", mmsi: "228016900" },
    { name: "Paul MEILHAT (Biotherm)", mmsi: "228135810" },
    { name: "Justine METTRAUX (TeamWork - Team SNEF)", mmsi: "227872570" },
    { name: "Giancarlo PEDOTE (Prysmian)", mmsi: "228070900" },
    { name: "Yoann RICHOMME (Paprec Arkéa)", mmsi: "228152910" },
    { name: "Alan ROURA (Hublot)", mmsi: "228104430" },
    { name: "Thomas RUYANT (VULNERABLE)", mmsi: "228163690" },
    { name: "Damien SEGUIN (Groupe APICIL)", mmsi: "228059900" },
    { name: "Kojiro SHIRAISHI (DMG MORI Global One)", mmsi: "227944390" },
    { name: "Sébastien SIMON (Groupe Dubreuil)", mmsi: "228195420" },
    { name: "Maxime SOREL (V and B - Monbana – Mayenne)", mmsi: "228118330" },
    { name: "Guirec SOUDÉE (Freelance.com)", mmsi: "227952290" },
    { name: "Denis VAN WEYNBERGH (D’Ieteren Group)", mmsi: "205862130" },
    { name: "Szabolcs WEÖRES (New Europe)", mmsi: "243042829" },
    { name: "Jingkun XU (Singchain Team Haikou)", mmsi: "228277800" }
];

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
    });
    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Safari/537.36');
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
    });

    const boatsData = [];

    for (const boat of boats) {
        const url = `https://www.vesselfinder.com/fr/?mmsi=${boat.mmsi}`;
        const detailsUrl = `https://www.vesselfinder.com/fr/vessels/details/${boat.mmsi}`;
        const boatInfo = { name: boat.name, mmsi: boat.mmsi };

        try {
            await page.goto(url, { waitUntil: 'networkidle2' });

            // Extraire la latitude et la longitude
            const coordinates = await page.evaluate(() => {
                const lat = document.querySelector('.coordinate.lat')?.innerText || "N/A";
                const lon = document.querySelector('.coordinate.lon')?.innerText || "N/A";
                return { lat, lon };
            });

            boatInfo.latitude = coordinates.lat;
            boatInfo.longitude = coordinates.lon;

        } catch (error) {
            console.error(`Erreur lors de la récupération des coordonnées pour ${boat.name} (MMSI: ${boat.mmsi}):`, error);
        }

        try {
            await page.goto(detailsUrl, { waitUntil: 'networkidle2' });

            await page.waitForSelector('#lastrep span', { timeout: 5000 });

            const lastPositionReceived = await page.evaluate(() => {
                const positionElem = document.querySelector('#lastrep span');
                return positionElem ? positionElem.textContent.trim() : "N/A";
            });

            boatInfo.lastPositionReceived = lastPositionReceived;

        } catch (error) {
            console.error(`Erreur lors de la récupération des détails pour ${boat.name} (MMSI: ${boat.mmsi}):`, error);
            boatInfo.lastPositionReceived = "N/A";
        }

        boatsData.push(boatInfo);
    }

    await browser.close();

    // Écrire les données dans un fichier JSON
    fs.writeFileSync('boatsData.json', JSON.stringify(boatsData, null, 2), 'utf-8');
    console.log("Données des bateaux enregistrées dans boatsData.json");

})();