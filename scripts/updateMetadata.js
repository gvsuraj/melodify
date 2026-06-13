    return JSON.parse(readFileSync(resolve(__dirname, "..", p), "utf-8"));
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) return JSON.parse(json);
  return null;
}

const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
const sa = getServiceAccount();
if (getApps().length === 0) {
  if (sa) initializeApp({ credential: cert(sa) });
  else initializeApp({ projectId });
}
const db = getFirestore();

const metadata = [
  { t: "Dheemthanakka Thillana", a: "S. P. Balasubrahmanyam", al: "Villu Pattukaran", g: "Tamil Folk", d: 276 },
  { t: "Endi Ippadi", a: "Santhosh Narayanan", al: "Enakkul Oruvan", g: "Tamil", d: 224 },
  { t: "Ennadi Maayavi Nee", a: "Sid Sriram", al: "Vada Chennai", g: "Tamil", d: 275 },
  { t: "Ennodu Nee Irundhal", a: "Sid Sriram, Sunitha Sarathy", al: "I", g: "Tamil", d: 355 },
  { t: "Ennodu Nee Irundhal (Reprise)", a: "Chinmayi", al: "I", g: "Tamil", d: 298 },
  { t: "God Bless U", a: "Yuvan Shankar Raja", al: "Aadavari Matalaku Ardhalu Verule", g: "Tamil", d: 246 },
  { t: "Goindhammavaala", a: "D. Imman", al: "Velaikkaran", g: "Tamil", d: 267 },
  { t: "Golden Sparrow", a: "G. V. Prakash Kumar", al: "Nilavuku En Mel Ennadi Kobam", g: "Tamil", d: 231 },
  { t: "Hey Minnale", a: "Haricharan", al: "Amaran", g: "Tamil", d: 258 },
  { t: "Hey Sandakkara", a: "D. Imman", al: "Irudhi Suttru", g: "Tamil", d: 242 },
  { t: "Hi Sonna Pothum", a: "Anirudh Ravichander", al: "Comali", g: "Tamil", d: 221 },
  { t: "Hukum", a: "Anirudh Ravichander", al: "Jailer", g: "Tamil", d: 237 },
  { t: "Idhazhin Oram", a: "Anand Aravindakshan", al: "3", g: "Tamil", d: 263 },
  { t: "Idhuvum Kadandhu Pogum", a: "Sid Sriram", al: "Netrikann", g: "Tamil", d: 301 },
  { t: "Innum Konjam Neram", a: "Vijay Prakash, Shweta Mohan", al: "Maryan", g: "Tamil", d: 326 },
  { t: "Iraivaa", a: "Anirudh Ravichander", al: "Velaikkaran", g: "Tamil", d: 332 },
  { t: "Jinguchaa", a: "Anirudh Ravichander", al: "Thug Life", g: "Tamil", d: 215 },
  { t: "Kaavaalaa", a: "Shilpa Rao, Anirudh Ravichander", al: "Jailer", g: "Tamil", d: 230 },
  { t: "Kadhaippoma", a: "Sid Sriram", al: "Oh My Kadavule", g: "Tamil", d: 286 },
  { t: "Kangal Edho", a: "Pradeep Kumar", al: "Chithha", g: "Tamil", d: 257 },
  { t: "Kanimaa", a: "Santhosh Narayanan", al: "Retro", g: "Tamil", d: 248 },
  { t: "Kannadi Poove", a: "Santhosh Narayanan", al: "Retro", g: "Tamil", d: 261 },
  { t: "Kannamma", a: "Pradeep Kumar", al: "Kaala", g: "Tamil", d: 289 },
  { t: "Kannana Kanne", a: "Sid Sriram", al: "Viswasam", g: "Tamil", d: 267 },
  { t: "Katchi Sera", a: "Sai Abhyankkar", al: "Katchi Sera", g: "Tamil Indie", d: 205 },
  { t: "Kissik", a: "Devi Sri Prasad", al: "Pushpa 2", g: "Tamil", d: 221 },
  { t: "Kondattam", a: "Anirudh Ravichander", al: "Manithan", g: "Tamil", d: 246 },
  { t: "Local Boys", a: "Dhanush, Velmurugan", al: "Ethir Neechal", g: "Tamil", d: 272 },
  { t: "Maacho Ennacho", a: "Sid Sriram", al: "Mersal", g: "Tamil", d: 289 },
  { t: "Maatikkinaru Orutharu", a: "Yuvan Shankar Raja", al: "Maan Karate", g: "Tamil", d: 244 },
  { t: "Manasilayo", a: "Anirudh Ravichander", al: "Vettaiyan", g: "Tamil", d: 236 },
  { t: "Maru Varthai Pesathey", a: "Sid Sriram", al: "Enai Noki Paayum Thota", g: "Tamil", d: 337 },
  { t: "Master The Blaster", a: "Anirudh Ravichander", al: "Master", g: "Tamil", d: 261 },
  { t: "Matta", a: "Anirudh Ravichander", al: "The Greatest of All Time", g: "Tamil", d: 232 },
  { t: "Maya Nadhi", a: "Pradeep Kumar, Swetha Mohan", al: "Kabali", g: "Tamil", d: 275 },
  { t: "Meesa Beauty", a: "Anirudh Ravichander", al: "Remo", g: "Tamil", d: 241 },
  { t: "Meesaya Murukku", a: "Hip Hop Tamizha", al: "Meesaya Murukku", g: "Tamil", d: 264 },
  { t: "Megham Karukatha", a: "Dhanush", al: "Thiruchitrambalam", g: "Tamil", d: 286 },
  { t: "Mei Nigara", a: "Sid Sriram", al: "24", g: "Tamil", d: 301 },
  { t: "Mersalayitten", a: "A. R. Rahman", al: "I", g: "Tamil", d: 309 },
  { t: "Moongil Thottam", a: "Abhay Jodhpurkar, Harini", al: "Kadal", g: "Tamil", d: 285 },
  { t: "Mudhal Nee Mudivum Nee", a: "Sid Sriram", al: "Mudhal Nee Mudivum Nee", g: "Tamil", d: 322 },
  { t: "Mundhinam Parthene", a: "Naresh Iyer, Prashanthini", al: "Vaaranam Aayiram", g: "Tamil", d: 348 },
  { t: "Naan Naan", a: "Santhosh Narayanan", al: "Mahaan", g: "Tamil", d: 238 },
  { t: "Naa Ready", a: "Thalapathy Vijay, Anirudh Ravichander", al: "Leo", g: "Tamil", d: 248 },
  { t: "Nee Singam Dhan", a: "A. R. Rahman", al: "Pathu Thala", g: "Tamil", d: 262 },
  { t: "Nenjame Nenjame", a: "Sid Sriram", al: "Maamannan", g: "Tamil", d: 267 },
  { t: "Nenjukkule", a: "Shakthisree Gopalan", al: "Kadal", g: "Tamil", d: 289 },
  { t: "Nenjukulla Nee", a: "Vijay Prakash", al: "Vadacurry", g: "Tamil", d: 254 },
  { t: "Netru Aval Irundhal", a: "Vijay Prakash, Chinmayi", al: "Maryan", g: "Tamil", d: 331 },
  { t: "New York Nagaram", a: "A. R. Rahman", al: "Sillunu Oru Kaadhal", g: "Tamil", d: 376 },
  { t: "Nira", a: "Sid Sriram", al: "Takkar", g: "Tamil", d: 278 },
  { t: "Oruthi Maelae", a: "Haricharan", al: "Jeeva", g: "Tamil", d: 261 },
  { t: "Osaka Osaka", a: "Anirudh Ravichander", al: "Vanakkam Chennai", g: "Tamil", d: 247 },
  { t: "Otha Thamarai", a: "Pradeep Kumar", al: "Buffoon", g: "Tamil", d: 292 },
  { t: "Paalam", a: "Shankar Mahadevan", al: "Kaththi", g: "Tamil", d: 302 },
  { t: "Pacha Elai", a: "Yuvan Shankar Raja", al: "Love Today", g: "Tamil", d: 236 },
  { t: "Pachai Kiligal", a: "K. J. Yesudas", al: "Indian", g: "Tamil", d: 325 },
  { t: "Pakkam Vanthu", a: "Anirudh Ravichander", al: "Kaththi", g: "Tamil", d: 251 },
  { t: "Pallikoodam", a: "Shweta Mohan", al: "Pallikoodam", g: "Tamil", d: 315 },
  { t: "Peelings", a: "Anirudh Ravichander", al: "Pushpa 2", g: "Tamil", d: 243 },
  { t: "Poi Vazhva", a: "Santhosh Narayanan", al: "Manithan", g: "Tamil", d: 286 },
  { t: "Polladha Boomi", a: "Dhanush", al: "Asuran", g: "Tamil", d: 274 },
  { t: "Porkanda Singam", a: "Anirudh Ravichander", al: "Vikram", g: "Tamil", d: 215 },
  { t: "Prabalamagavey", a: "Sid Sriram", al: "Enakku Endey Kidaiyaathu", g: "Tamil", d: 259 },
  { t: "Quit Pannuda", a: "Anirudh Ravichander", al: "Master", g: "Tamil", d: 217 },
  { t: "Ratchasa Maamaney", a: "Shreya Ghoshal, Shankar Mahadevan", al: "Ponniyin Selvan 1", g: "Tamil", d: 285 },
  { t: "Remo Nee Kadhalan", a: "Anirudh Ravichander", al: "Remo", g: "Tamil", d: 263 },
  { t: "Rise Of Dragon", a: "Anirudh Ravichander", al: "Dragon", g: "Tamil", d: 224 },
  { t: "Saitji Saitji", a: "Hip Hop Tamizha", al: "Meesaya Murukku", g: "Tamil", d: 232 },
  { t: "Sawadeeka", a: "Anirudh Ravichander", al: "Kaaki Sattai", g: "Tamil", d: 241 },
  { t: "Selfie Pulla", a: "Vijay, Sunidhi Chauhan", al: "Kaththi", g: "Tamil", d: 289 },
  { t: "Single Pasanga", a: "Kaushik Krish", al: "Natpe Thunai", g: "Tamil", d: 254 },
  { t: "Sithira Puthiri", a: "Sai Abhyankkar", al: "Sithira Puthiri", g: "Tamil Indie", d: 226 },
  { t: "Sonapareeya", a: "Javed Ali, Haricharan", al: "Maryan", g: "Tamil", d: 301 },
  { t: "Soodana", a: "Shreya Ghoshal", al: "Kanda Naal Mudhal", g: "Tamil", d: 274 },
  { t: "Tamizselvi", a: "Anirudh Ravichander", al: "Remo", g: "Tamil", d: 247 },
  { t: "Thaarame Thaarame", a: "Sid Sriram", al: "Kadaram Kondan", g: "Tamil", d: 223 },
  { t: "Thaiyya Thaiyya", a: "Hariharan", al: "Uyire", g: "Tamil", d: 386 },
  { t: "Thangame", a: "Anirudh Ravichander", al: "Naanum Rowdy Dhaan", g: "Tamil", d: 272 },
  { t: "Theansudare", a: "Sean Roldan", al: "Lover", g: "Tamil", d: 249 },
  { t: "Thenmozhi", a: "Santhosh Narayanan", al: "Thiruchitrambalam", g: "Tamil", d: 169 },
  { t: "Udhungada Sangu", a: "Anirudh Ravichander", al: "Velaiyilla Pattathari", g: "Tamil", d: 233 },
  { t: "Ullaallaa", a: "Nakash Aziz", al: "Petta", g: "Tamil", d: 265 },
  { t: "Unakku Thaan", a: "Santhosh Narayanan, Dhvani Kailas", al: "Chithha", g: "Tamil", d: 237 },
  { t: "Un Mela Aasadhan", a: "Yuvan Shankar Raja", al: "Aayirathil Oruvan", g: "Tamil", d: 301 },
  { t: "Unnai Kaanadhu Naan", a: "Shankar Mahadevan", al: "Vishwaroopam", g: "Tamil", d: 356 },
  { t: "Usuru Narambula", a: "D. Imman", al: "Irudhi Suttru", g: "Tamil", d: 247 },
  { t: "Vaada Maappilley", a: "Tippu, Rita", al: "Villu", g: "Tamil", d: 263 },
  { t: "Vaadi Nee Vaadi", a: "Anirudh Ravichander", al: "Meesaya Murukku", g: "Tamil", d: 228 },
  { t: "Vaathi Coming", a: "Anirudh Ravichander, Gana Balachandar", al: "Master", g: "Tamil", d: 230 },
  { t: "Vaaya En Veera", a: "Shakthisree Gopalan", al: "Kanchana 2", g: "Tamil", d: 284 },
  { t: "Varava Varava", a: "Anirudh Ravichander", al: "Naanum Rowdy Dhaan", g: "Tamil", d: 248 },
  { t: "Vazhithunaiye", a: "Leon James", al: "Dragon", g: "Tamil", d: 256 },
  { t: "Veesum Velichathile", a: "Sean Roldan", al: "Naanum Rowdy Dhaan", g: "Tamil", d: 274 },
  { t: "Verithanam", a: "Thalapathy Vijay", al: "Bigil", g: "Tamil", d: 245 },
  { t: "Water Packet", a: "Santhosh Narayanan", al: "Madras", g: "Tamil", d: 232 },
  { t: "What A Karavad", a: "Anirudh Ravichander", al: "Velaiyilla Pattathari", g: "Tamil", d: 241 },
  { t: "Where Is The Party", a: "Mukesh, Priyadarshini", al: "Silambattam", g: "Tamil", d: 291 },
  { t: "Whistle Podu", a: "A. R. Rahman", al: "The Greatest of All Time", g: "Tamil", d: 262 },
  { t: "Yaanji", a: "Anirudh Ravichander, Shakthisree Gopalan", al: "Vikram Vedha", g: "Tamil", d: 274 },
  { t: "Yaarenna Sonnalum", a: "Anthony Daasan", al: "Aambala", g: "Tamil", d: 247 },
  { t: "Yathe Yathe", a: "G. V. Prakash Kumar", al: "Aadukalam", g: "Tamil", d: 298 },
  { t: "Yedi", a: "Dhanush", al: "Nilavuku En Mel Ennadi Kobam", g: "Tamil", d: 214 },
  { t: "Yennai Maatrum Kadhale", a: "Sid Sriram", al: "Naanum Rowdy Dhaan", g: "Tamil", d: 286 },

  { t: "Aalaporan Thamizhan", a: "A. R. Rahman, Kailash Kher, Sathya Prakash", al: "Mersal", g: "Tamil", d: 339 },
  { t: "Adangaatha Asuran", a: "Dhanush, A. R. Rahman", al: "Raayan", g: "Tamil", d: 245 },
  { t: "Ambikapathy", a: "Naresh Iyer", al: "Ambikapathy", g: "Tamil", d: 287 },
  { t: "Arakkiyae", a: "Yuvan Shankar Raja", al: "Oh Manapenne", g: "Tamil", d: 267 },
  { t: "Avalum Naanum", a: "Vijay Yesudas", al: "Achcham Yenbadhu Madamaiyada", g: "Tamil", d: 315 },
  { t: "Chennai City Gangsta", a: "Anirudh Ravichander", al: "Vanakkam Chennai", g: "Tamil", d: 276 },
  { t: "Aala Sachuputta", a: "Vijay Yesudas", al: "Vil Ambu", g: "Tamil", d: 254 },
  { t: "Adiye", a: "Sid Sriram", al: "Bachelor", g: "Tamil", d: 292 },
  { t: "Anbenum", a: "Sid Sriram", al: "Leo", g: "Tamil", d: 242 },
  { t: "Ava Enna Enna", a: "Karthik, V. V. Prasanna", al: "Vaaranam Aayiram", g: "Tamil", d: 328 },
  { t: "Aye Aye Aye", a: "Hip Hop Tamizha", al: "Aambala", g: "Tamil", d: 231 },
  { t: "Daddy Mummy", a: "Mamta Mohandas, Naveen", al: "Villu", g: "Tamil", d: 295 },
  { t: "Aasa Kooda", a: "Sai Abhyankkar", al: "Aasa Kooda", g: "Tamil Indie", d: 214 },
  { t: "Agasatha", a: "Yuvan Shankar Raja", al: "Cuckoo", g: "Tamil", d: 278 },
  { t: "Arabic Kuthu", a: "Anirudh Ravichander, Jonita Gandhi", al: "Beast", g: "Tamil", d: 301 },
  { t: "Aval", a: "Pradeep Kumar", al: "Manithan", g: "Tamil", d: 269 },
  { t: "Boomi Enna Suthudhe", a: "Anirudh Ravichander", al: "Ethir Neechal", g: "Tamil", d: 283 },
  { t: "Dheema", a: "Anirudh Ravichander", al: "Love Insurance Kompany", g: "Tamil", d: 238 },
];

// Build exact title→meta map
const exactMap = {};
for (const m of metadata) exactMap[m.t.toLowerCase().replace(/[^a-z0-9]/g, "")] = m;

// Manual filename→title overrides for songs that don't match via title
const fileOverrides = {
  "endi-ippadi": "Endi Ippadi",
  "ennadi-maayavi-nee": "Ennadi Maayavi Nee",
  "ennodu-nee-irundhal": "Ennodu Nee Irundhal",
  "ennodu-nee-irundhal-reprise": "Ennodu Nee Irundhal (Reprise)",
  "idhazhin-oram": "Idhazhin Oram",
  "innum-konjam-neram": "Innum Konjam Neram",
  "kangal-edho": "Kangal Edho",
  "kannana-kanne": "Kannana Kanne",
  "local-boys": "Local Boys",
  "maacho-ennacho": "Maacho Ennacho",
  "master-the-blaster": "Master The Blaster",
  "maya-nadhi": "Maya Nadhi",
  "meesa-beauty": "Meesa Beauty",
  "meesaya-murukku": "Meesaya Murukku",
  "megham-karukatha": "Megham Karukatha",
  "mei-nigara": "Mei Nigara",
  "moongil-thottam": "Moongil Thottam",
  "mundhinam-parthene": "Mundhinam Parthene",
  "naan-naan": "Naan Naan",
  "naa-ready": "Naa Ready",
  "nee-singam-dhan": "Nee Singam Dhan",
  "nenjame-nenjame": "Nenjame Nenjame",
  "nenjukulla-nee": "Nenjukulla Nee",
  "netru-aval-irundhal": "Netru Aval Irundhal",
  "oruthi-maelae": "Oruthi Maelae",
  "osaka-osaka": "Osaka Osaka",
  "otha-thamarai": "Otha Thamarai",
  "pacha-elai": "Pacha Elai",
  "pachai-kiligal": "Pachai Kiligal",
  "pakkam-vanthu": "Pakkam Vanthu",
  "poi-vazhva": "Poi Vazhva",
  "polladha-boomi": "Polladha Boomi",
  "porkanda-singam": "Porkanda Singam",
  "quit-pannuda": "Quit Pannuda",
  "ratchasa-maamaney": "Ratchasa Maamaney",
  "remo-nee-kadhalan": "Remo Nee Kadhalan",
  "saitji-saitji": "Saitji Saitji",
  "selfie-pulla": "Selfie Pulla",
  "single-pasanga": "Single Pasanga",
  "sithira-puthiri": "Sithira Puthiri",
  "thaarame-thaarame": "Thaarame Thaarame",
  "thaiyya-thaiyya": "Thaiyya Thaiyya",
  "udhungada-sangu": "Udhungada Sangu",
  "un-mela-aasadhaan": "Un Mela Aasadhan",
  "unnai-kaanadhu-naan": "Unnai Kaanadhu Naan",
  "usuru-narambula": "Usuru Narambula",
  "vaadi-nee-vaadi": "Vaadi Nee Vaadi",
  "vaathi-coming": "Vaathi Coming",
  "vaaya-en-veera": "Vaaya En Veera",
  "varava-varava": "Varava Varava",
  "veesum-velichathile": "Veesum Velichathile",
  "yaarenna-sonnalum": "Yaarenna Sonnalum",
  "yathe-yathe": "Yathe Yathe",
  "yennai-maatrum-kadhale": "Yennai Maatrum Kadhale",
  "tamilselvi": "Tamizselvi",
  "hi-sonna-pothum": "Hi Sonna Pothum",
  "hukum": "Hukum",
  "hey-sandakkara": "Hey Sandakkara",
  "manasilaayo": "Manasilayo",
  "maru-varthai-pesathey": "Maru Varthai Pesathey",
  "mudhal-nee-mudivum-nee": "Mudhal Nee Mudivum Nee",
  "idhazhin-oram": "Idhazhin Oram",
  "idhazhin oram (the innocence of love)": "Idhazhin Oram",
  "unakku-thaan": "Unakku Thaan",
  "soodaana": "Soodana",
  "soodana": "Soodana",
  "aala-sachuputta-kannala": "Aala Sachuputta",
  "aalaporan-thamizhan": "Aalaporan Thamizhan",
  "aasa-kooda": "Aasa Kooda",
  "adangaatha-asuran": "Adangaatha Asuran",
  "adiye": "Adiye",
  "agasatha": "Agasatha",
  "ambikapathy": "Ambikapathy",
  "anbenum": "Anbenum",
  "arabic-kuthu": "Arabic Kuthu",
  "arakkiyae": "Arakkiyae",
  "ava-enna-enna": "Ava Enna Enna",
  "aval": "Aval",
  "avalum-naanum": "Avalum Naanum",
  "aye-aye-aye": "Aye Aye Aye",
  "boomi-enna-suthudhe": "Boomi Enna Suthudhe",
  "chennai-city-gangsta": "Chennai City Gangsta",
  "daddy-mummy": "Daddy Mummy",
  "dheema": "Dheema",
  "goindhammavaala": "Goindhammavaala",
  "idhuvum-kadandhu-pogum": "Idhuvum Kadandhu Pogum",
  "kaavaalaa": "Kaavaalaa",
  "jinguchaa": "Jinguchaa",
  "kadhaippoma": "Kadhaippoma",
  "kannamma": "Kannamma",
  "maatikkinaaru-orutharu": "Maatikkinaru Orutharu",
  "nira": "Nira",
  "pallikoodam": "Pallikoodam",
  "sithira-puthiri": "Sithira Puthiri",
  "thenmozhi": "Thenmozhi",
  "ullaallaa": "Ullaallaa",
  "verithanam": "Verithanam",
  "yaanji": "Yaanji"
};

// Also build a dropboxPath-lowercase → metadata map from fileOverrides
const dropboxToMeta = {};
for (const [file, title] of Object.entries(fileOverrides)) {
  if (title) {
    const meta = metadata.find((m) => m.t.toLowerCase() === title.toLowerCase());
    if (meta) dropboxToMeta[file.toLowerCase()] = meta;
  }
}

async function main() {
  const snap = await db.collection("songs").get();
  const allSongs = snap.docs.map((d) => ({ ref: d.ref, id: d.id, ...d.data() }));

  let updated = 0;
  let skipped = 0;
  let noMatch = 0;

  for (const song of allSongs) {
    const norm = song.title.toLowerCase().replace(/[^a-z0-9]/g, "");
    let meta = exactMap[norm];

    // Try filename matching if exact match failed
    if (!meta && song.dropboxPath) {
      const file = song.dropboxPath.split("/").pop().replace(/\.[^/.]+$/, "").toLowerCase();
      meta = dropboxToMeta[file];

      if (!meta) {
        // Try partial: check if the file starts with or is contained in an override key
        for (const [key, _] of Object.entries(fileOverrides)) {
          if (file === key || file.startsWith(key + "-") || file.startsWith(key + " ") || file.startsWith(key + ".") || file.startsWith(key + "_")) {
            const m = dropboxToMeta[key];
            if (m) { meta = m; break; }
          }
        }
      }

      if (!meta) {
        // Try cleaning massTamilan suffixes
        const cleaned = file.replace(/-masstamilan\..*/i, "").replace(/-mass-tamilan\..*/i, "").trim();
        meta = dropboxToMeta[cleaned];
      }

      if (!meta) {
        // Try replacing hyphens with spaces in the override keys
        for (const [key, _] of Object.entries(fileOverrides)) {
          const spaced = key.replace(/-/g, " ");
          if (file === spaced || file.startsWith(spaced + " ")) {
            const m = dropboxToMeta[key];
            if (m) { meta = m; break; }
          }
        }
      }
    }

    if (meta) {
      await song.ref.update({
        title: meta.t,
        artist: meta.a,
        album: meta.al,
        genre: meta.g,
        duration: meta.d,
      });
      console.log(`✓ ${song.title} → ${meta.t} | ${meta.a}`);
      updated++;
    } else if (song.dropboxPath) {
      const file = song.dropboxPath.split("/").pop().replace(/\.[^/.]+$/, "");
      console.log(`- SKIP: ${song.title} (not in your metadata list)`);
      skipped++;
    } else {
      console.log(`- SKIP: ${song.title} (no dropboxPath)`);
      skipped++;
    }
  }

  console.log(`\nDone! Updated: ${updated}, Skipped (not in your metadata): ${skipped}, Unknown: ${noMatch}`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
