import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { readFileSync, existsSync } from "fs";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "..", ".env") });

function getServiceAccount() {
  const p = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (p && existsSync(resolve(__dirname, "..", p)))
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
  { title: "Dheemthanakka Thillana", artist: "S. P. Balasubrahmanyam", album: "Villu Pattukaran", genre: "Tamil Folk", duration: 276 },
  { title: "Endi Ippadi", artist: "Santhosh Narayanan", album: "Enakkul Oruvan", genre: "Tamil", duration: 224 },
  { title: "Ennadi Maayavi Nee", artist: "Sid Sriram", album: "Vada Chennai", genre: "Tamil", duration: 275 },
  { title: "Ennodu Nee Irundhal", artist: "Sid Sriram, Sunitha Sarathy", album: "I", genre: "Tamil", duration: 355 },
  { title: "Ennodu Nee Irundhal (Reprise)", artist: "Chinmayi", album: "I", genre: "Tamil", duration: 298 },
  { title: "God Bless U", artist: "Yuvan Shankar Raja", album: "Aadavari Matalaku Ardhalu Verule", genre: "Tamil", duration: 246 },
  { title: "Goindhammavaala", artist: "D. Imman", album: "Velaikkaran", genre: "Tamil", duration: 267 },
  { title: "Golden Sparrow", artist: "G. V. Prakash Kumar", album: "Nilavuku En Mel Ennadi Kobam", genre: "Tamil", duration: 231 },
  { title: "Hey Minnale", artist: "Haricharan", album: "Amaran", genre: "Tamil", duration: 258 },
  { title: "Hey Sandakkara", artist: "D. Imman", album: "Irudhi Suttru", genre: "Tamil", duration: 242 },
  { title: "Hi Sonna Pothum", artist: "Anirudh Ravichander", album: "Comali", genre: "Tamil", duration: 221 },
  { title: "Hukum", artist: "Anirudh Ravichander", album: "Jailer", genre: "Tamil", duration: 237 },
  { title: "Idhazhin Oram", artist: "Anand Aravindakshan", album: "3", genre: "Tamil", duration: 263 },
  { title: "Idhuvum Kadandhu Pogum", artist: "Sid Sriram", album: "Netrikann", genre: "Tamil", duration: 301 },
  { title: "Innum Konjam Neram", artist: "Vijay Prakash, Shweta Mohan", album: "Maryan", genre: "Tamil", duration: 326 },
  { title: "Iraivaa", artist: "Anirudh Ravichander", album: "Velaikkaran", genre: "Tamil", duration: 332 },
  { title: "Jinguchaa", artist: "Anirudh Ravichander", album: "Thug Life", genre: "Tamil", duration: 215 },
  { title: "Kaavaalaa", artist: "Shilpa Rao, Anirudh Ravichander", album: "Jailer", genre: "Tamil", duration: 230 },
  { title: "Kadhaippoma", artist: "Sid Sriram", album: "Oh My Kadavule", genre: "Tamil", duration: 286 },
  { title: "Kangal Edho", artist: "Pradeep Kumar", album: "Chithha", genre: "Tamil", duration: 257 },
  { title: "Kanimaa", artist: "Santhosh Narayanan", album: "Retro", genre: "Tamil", duration: 248 },
  { title: "Kannadi Poove", artist: "Santhosh Narayanan", album: "Retro", genre: "Tamil", duration: 261 },
  { title: "Kannamma", artist: "Pradeep Kumar", album: "Kaala", genre: "Tamil", duration: 289 },
  { title: "Kannana Kanne", artist: "Sid Sriram", album: "Viswasam", genre: "Tamil", duration: 267 },
  { title: "Katchi Sera", artist: "Sai Abhyankkar", album: "Katchi Sera", genre: "Tamil Indie", duration: 205 },
  { title: "Kissik", artist: "Devi Sri Prasad", album: "Pushpa 2", genre: "Tamil", duration: 221 },
  { title: "Kondattam", artist: "Anirudh Ravichander", album: "Manithan", genre: "Tamil", duration: 246 },
  { title: "Local Boys", artist: "Dhanush, Velmurugan", album: "Ethir Neechal", genre: "Tamil", duration: 272 },
  { title: "Maacho Ennacho", artist: "Sid Sriram", album: "Mersal", genre: "Tamil", duration: 289 },
  { title: "Maatikkinaru Orutharu", artist: "Yuvan Shankar Raja", album: "Maan Karate", genre: "Tamil", duration: 244 },
  { title: "Manasilayo", artist: "Anirudh Ravichander", album: "Vettaiyan", genre: "Tamil", duration: 236 },
  { title: "Maru Varthai Pesathey", artist: "Sid Sriram", album: "Enai Noki Paayum Thota", genre: "Tamil", duration: 337 },
  { title: "Master The Blaster", artist: "Anirudh Ravichander", album: "Master", genre: "Tamil", duration: 261 },
  { title: "Matta", artist: "Anirudh Ravichander", album: "The Greatest of All Time", genre: "Tamil", duration: 232 },
  { title: "Maya Nadhi", artist: "Pradeep Kumar, Swetha Mohan", album: "Kabali", genre: "Tamil", duration: 275 },
  { title: "Meesa Beauty", artist: "Anirudh Ravichander", album: "Remo", genre: "Tamil", duration: 241 },
  { title: "Meesaya Murukku", artist: "Hip Hop Tamizha", album: "Meesaya Murukku", genre: "Tamil", duration: 264 },
  { title: "Megham Karukatha", artist: "Dhanush", album: "Thiruchitrambalam", genre: "Tamil", duration: 286 },
  { title: "Mei Nigara", artist: "Sid Sriram", album: "24", genre: "Tamil", duration: 301 },
  { title: "Mersalayitten", artist: "A. R. Rahman", album: "I", genre: "Tamil", duration: 309 },
  { title: "Moongil Thottam", artist: "Abhay Jodhpurkar, Harini", album: "Kadal", genre: "Tamil", duration: 285 },
  { title: "Mudhal Nee Mudivum Nee", artist: "Sid Sriram", album: "Mudhal Nee Mudivum Nee", genre: "Tamil", duration: 322 },
  { title: "Mundhinam Parthene", artist: "Naresh Iyer, Prashanthini", album: "Vaaranam Aayiram", genre: "Tamil", duration: 348 },
  { title: "Naan Naan", artist: "Santhosh Narayanan", album: "Mahaan", genre: "Tamil", duration: 238 },
  { title: "Naa Ready", artist: "Thalapathy Vijay, Anirudh Ravichander", album: "Leo", genre: "Tamil", duration: 248 },
  { title: "Nee Singam Dhan", artist: "A. R. Rahman", album: "Pathu Thala", genre: "Tamil", duration: 262 },
  { title: "Nenjame Nenjame", artist: "Sid Sriram", album: "Maamannan", genre: "Tamil", duration: 267 },
  { title: "Nenjukkule", artist: "Shakthisree Gopalan", album: "Kadal", genre: "Tamil", duration: 289 },
  { title: "Nenjukulla Nee", artist: "Vijay Prakash", album: "Vadacurry", genre: "Tamil", duration: 254 },
  { title: "Netru Aval Irundhal", artist: "Vijay Prakash, Chinmayi", album: "Maryan", genre: "Tamil", duration: 331 },
  { title: "New York Nagaram", artist: "A. R. Rahman", album: "Sillunu Oru Kaadhal", genre: "Tamil", duration: 376 },
  { title: "Nira", artist: "Sid Sriram", album: "Takkar", genre: "Tamil", duration: 278 },
  { title: "Oruthi Maelae", artist: "Haricharan", album: "Jeeva", genre: "Tamil", duration: 261 },
  { title: "Osaka Osaka", artist: "Anirudh Ravichander", album: "Vanakkam Chennai", genre: "Tamil", duration: 247 },
  { title: "Otha Thamarai", artist: "Pradeep Kumar", album: "Buffoon", genre: "Tamil", duration: 292 },
  { title: "Paalam", artist: "Shankar Mahadevan", album: "Kaththi", genre: "Tamil", duration: 302 },
  { title: "Pacha Elai", artist: "Yuvan Shankar Raja", album: "Love Today", genre: "Tamil", duration: 236 },
  { title: "Pachai Kiligal", artist: "K. J. Yesudas", album: "Indian", genre: "Tamil", duration: 325 },
  { title: "Pakkam Vanthu", artist: "Anirudh Ravichander", album: "Kaththi", genre: "Tamil", duration: 251 },
  { title: "Pallikoodam", artist: "Shweta Mohan", album: "Pallikoodam", genre: "Tamil", duration: 315 },
  { title: "Peelings", artist: "Anirudh Ravichander", album: "Pushpa 2", genre: "Tamil", duration: 243 },
  { title: "Poi Vazhva", artist: "Santhosh Narayanan", album: "Manithan", genre: "Tamil", duration: 286 },
  { title: "Polladha Boomi", artist: "Dhanush", album: "Asuran", genre: "Tamil", duration: 274 },
  { title: "Porkanda Singam", artist: "Anirudh Ravichander", album: "Vikram", genre: "Tamil", duration: 215 },
  { title: "Prabalamagavey", artist: "Sid Sriram", album: "Enakku Endey Kidaiyaathu", genre: "Tamil", duration: 259 },
  { title: "Quit Pannuda", artist: "Anirudh Ravichander", album: "Master", genre: "Tamil", duration: 217 },
  { title: "Ratchasa Maamaney", artist: "Shreya Ghoshal, Shankar Mahadevan", album: "Ponniyin Selvan 1", genre: "Tamil", duration: 285 },
  { title: "Remo Nee Kadhalan", artist: "Anirudh Ravichander", album: "Remo", genre: "Tamil", duration: 263 },
  { title: "Rise Of Dragon", artist: "Anirudh Ravichander", album: "Dragon", genre: "Tamil", duration: 224 },
  { title: "Saitji Saitji", artist: "Hip Hop Tamizha", album: "Meesaya Murukku", genre: "Tamil", duration: 232 },
  { title: "Sawadeeka", artist: "Anirudh Ravichander", album: "Kaaki Sattai", genre: "Tamil", duration: 241 },
  { title: "Selfie Pulla", artist: "Vijay, Sunidhi Chauhan", album: "Kaththi", genre: "Tamil", duration: 289 },
  { title: "Single Pasanga", artist: "Kaushik Krish", album: "Natpe Thunai", genre: "Tamil", duration: 254 },
  { title: "Sithira Puthiri", artist: "Sai Abhyankkar", album: "Sithira Puthiri", genre: "Tamil Indie", duration: 226 },
  { title: "Sonapareeya", artist: "Javed Ali, Haricharan", album: "Maryan", genre: "Tamil", duration: 301 },
  { title: "Soodana", artist: "Shreya Ghoshal", album: "Kanda Naal Mudhal", genre: "Tamil", duration: 274 },
  { title: "Tamizselvi", artist: "Anirudh Ravichander", album: "Remo", genre: "Tamil", duration: 247 },
  { title: "Thaarame Thaarame", artist: "Sid Sriram", album: "Kadaram Kondan", genre: "Tamil", duration: 223 },
  { title: "Thaiyya Thaiyya", artist: "Hariharan", album: "Uyire", genre: "Tamil", duration: 386 },
  { title: "Thangame", artist: "Anirudh Ravichander", album: "Naanum Rowdy Dhaan", genre: "Tamil", duration: 272 },
  { title: "Theansudare", artist: "Sean Roldan", album: "Lover", genre: "Tamil", duration: 249 },
  { title: "Thenmozhi", artist: "Santhosh Narayanan", album: "Thiruchitrambalam", genre: "Tamil", duration: 169 },
  { title: "Udhungada Sangu", artist: "Anirudh Ravichander", album: "Velaiyilla Pattathari", genre: "Tamil", duration: 233 },
  { title: "Ullaallaa", artist: "Nakash Aziz", album: "Petta", genre: "Tamil", duration: 265 },
  { title: "Unakku Thaan", artist: "Santhosh Narayanan, Dhvani Kailas", album: "Chithha", genre: "Tamil", duration: 237 },
  { title: "Un Mela Aasadhan", artist: "Yuvan Shankar Raja", album: "Aayirathil Oruvan", genre: "Tamil", duration: 301 },
  { title: "Unnai Kaanadhu Naan", artist: "Shankar Mahadevan", album: "Vishwaroopam", genre: "Tamil", duration: 356 },
  { title: "Usuru Narambula", artist: "D. Imman", album: "Irudhi Suttru", genre: "Tamil", duration: 247 },
  { title: "Vaada Maappilley", artist: "Tippu, Rita", album: "Villu", genre: "Tamil", duration: 263 },
  { title: "Vaadi Nee Vaadi", artist: "Anirudh Ravichander", album: "Meesaya Murukku", genre: "Tamil", duration: 228 },
  { title: "Vaathi Coming", artist: "Anirudh Ravichander, Gana Balachandar", album: "Master", genre: "Tamil", duration: 230 },
  { title: "Vaaya En Veera", artist: "Shakthisree Gopalan", album: "Kanchana 2", genre: "Tamil", duration: 284 },
  { title: "Varava Varava", artist: "Anirudh Ravichander", album: "Naanum Rowdy Dhaan", genre: "Tamil", duration: 248 },
  { title: "Vazhithunaiye", artist: "Leon James", album: "Dragon", genre: "Tamil", duration: 256 },
  { title: "Veesum Velichathile", artist: "Sean Roldan", album: "Naanum Rowdy Dhaan", genre: "Tamil", duration: 274 },
  { title: "Verithanam", artist: "Thalapathy Vijay", album: "Bigil", genre: "Tamil", duration: 245 },
  { title: "Water Packet", artist: "Santhosh Narayanan", album: "Madras", genre: "Tamil", duration: 232 },
  { title: "What A Karavad", artist: "Anirudh Ravichander", album: "Velaiyilla Pattathari", genre: "Tamil", duration: 241 },
  { title: "Where Is The Party", artist: "Mukesh, Priyadarshini", album: "Silambattam", genre: "Tamil", duration: 291 },
  { title: "Whistle Podu", artist: "A. R. Rahman", album: "The Greatest of All Time", genre: "Tamil", duration: 262 },
  { title: "Yaanji", artist: "Anirudh Ravichander, Shakthisree Gopalan", album: "Vikram Vedha", genre: "Tamil", duration: 274 },
  { title: "Yaarenna Sonnalum", artist: "Anthony Daasan", album: "Aambala", genre: "Tamil", duration: 247 },
  { title: "Yathe Yathe", artist: "G. V. Prakash Kumar", album: "Aadukalam", genre: "Tamil", duration: 298 },
  { title: "Yedi", artist: "Dhanush", album: "Nilavuku En Mel Ennadi Kobam", genre: "Tamil", duration: 214 },
  { title: "Yennai Maatrum Kadhale", artist: "Sid Sriram", album: "Naanum Rowdy Dhaan", genre: "Tamil", duration: 286 },

  { title: "Aalaporan Thamizhan", artist: "A. R. Rahman, Kailash Kher, Sathya Prakash", album: "Mersal", genre: "Tamil", duration: 339 },
  { title: "Adangaatha Asuran", artist: "Dhanush, A. R. Rahman", album: "Raayan", genre: "Tamil", duration: 245 },
  { title: "Ambikapathy", artist: "Naresh Iyer", album: "Ambikapathy", genre: "Tamil", duration: 287 },
  { title: "Arakkiyae", artist: "Yuvan Shankar Raja", album: "Oh Manapenne", genre: "Tamil", duration: 267 },
  { title: "Avalum Naanum", artist: "Vijay Yesudas", album: "Achcham Yenbadhu Madamaiyada", genre: "Tamil", duration: 315 },
  { title: "Chennai City Gangsta", artist: "Anirudh Ravichander", album: "Vanakkam Chennai", genre: "Tamil", duration: 276 },
  { title: "Aala Sachuputta", artist: "Vijay Yesudas", album: "Vil Ambu", genre: "Tamil", duration: 254 },
  { title: "Adiye", artist: "Sid Sriram", album: "Bachelor", genre: "Tamil", duration: 292 },
  { title: "Anbenum", artist: "Sid Sriram", album: "Leo", genre: "Tamil", duration: 242 },
  { title: "Ava Enna Enna", artist: "Karthik, V. V. Prasanna", album: "Vaaranam Aayiram", genre: "Tamil", duration: 328 },
  { title: "Aye Aye Aye", artist: "Hip Hop Tamizha", album: "Aambala", genre: "Tamil", duration: 231 },
  { title: "Daddy Mummy", artist: "Mamta Mohandas, Naveen", album: "Villu", genre: "Tamil", duration: 295 },
  { title: "Aasa Kooda", artist: "Sai Abhyankkar", album: "Aasa Kooda", genre: "Tamil Indie", duration: 214 },
  { title: "Agasatha", artist: "Yuvan Shankar Raja", album: "Cuckoo", genre: "Tamil", duration: 278 },
  { title: "Arabic Kuthu", artist: "Anirudh Ravichander, Jonita Gandhi", album: "Beast", genre: "Tamil", duration: 301 },
  { title: "Aval", artist: "Pradeep Kumar", album: "Manithan", genre: "Tamil", duration: 269 },
  { title: "Boomi Enna Suthudhe", artist: "Anirudh Ravichander", album: "Ethir Neechal", genre: "Tamil", duration: 283 },
  { title: "Dheema", artist: "Anirudh Ravichander", album: "Love Insurance Kompany", genre: "Tamil", duration: 238 },
];

const metaMap = {};
for (const m of metadata) {
  metaMap[m.title.toLowerCase().replace(/[^a-z0-9]/g, "")] = m;
}

const fileOverrides = {
  "aala-sachuputta-kannala": "Aala Sachuputta",
  "aalaporan-thamizhan-masstamilan.com": "Aalaporan Thamizhan",
  "aasa-kooda": "Aasa Kooda",
  "adangaatha-asuran": "Adangaatha Asuran",
  "adiye-masstamilan.fm": "Adiye",
  "agasatha": "Agasatha",
  "ambikapathy": "Ambikapathy",
  "anbenum-masstamilan.dev": "Anbenum",
  "arabic-kuthu---halamithi-habibo-masstamilan.so": "Arabic Kuthu",
  "arakkiyae-masstamilan.fm": "Arakkiyae",
  "ava-enna-enna-masstamilan.com": "Ava Enna Enna",
  "aval": "Aval",
  "avalum-naanum": "Avalum Naanum",
  "aye-aye-aye-masstamilan.fm": "Aye Aye Aye",
  "boomi-enna-suthudhe": "Boomi Enna Suthudhe",
  "chennai-city-gangsta": "Chennai City Gangsta",
  "daddy-mummy": "Daddy Mummy",
  "dheema-masstamilan.dev": "Dheema",
  "endi-ippadi": "Endi Ippadi",
  "ennadi-maayavi-nee-masstamilan.com": "Ennadi Maayavi Nee",
  "dheemthanakka-thillana": null,
  "ennodu-nee-irundhal-reprise": "Ennodu Nee Irundhal (Reprise)",
  "ennodu-nee-irundhal": "Ennodu Nee Irundhal",
  "god-bless-u": null,
  "goindhammavaala-masstamilan.com": "Goindhammavaala",
  "golden-sparrow": null,
  "hey-minnale": null,
  "hey-sandakkara": "Hey Sandakkara",
  "hukum---thalaivar-alappara-masstamilan.dev": "Hukum",
  "hi-sonna-pothum-masstamilan.org": "Hi Sonna Pothum",
  "idhazhin-oram-the-innocence-of-love": "Idhazhin Oram",
  "idhuvum-kadandhu-pogum-the-healing-song-masstamilan.fm": "Idhuvum Kadandhu Pogum",
  "innum-konjam-neram": "Innum Konjam Neram",
  "iraivaa": null,
  "kaavaalaa-masstamilan.dev": "Kaavaalaa",
  "jinguchaa-masstamilan.dev": "Jinguchaa",
  "kadhaippoma-masstamilan.io": "Kadhaippoma",
  "kangal-edho-masstamilan.dev": "Kangal Edho",
  "kanimaa": null,
  "kannadi-poove": null,
  "kannamma-masstamilan.io": "Kannamma",
  "kannana-kanne": "Kannana Kanne",
  "kissik": null,
  "katchi-sera": null,
  "kondattam": null,
  "local-boys": "Local Boys",
  "maacho-ennacho-masstamilan.com": "Maacho Ennacho",
  "maatikkinaaru-orutharu": "Maatikkinaru Orutharu",
  "manasilaayo": "Manasilayo",
  "master-the-blaster-masstamilan.io": "Master The Blaster",
  "maru-varthai-pesathey-masstamilan.com": "Maru Varthai Pesathey",
  "matta": null,
  "maya-nadhi": "Maya Nadhi",
  "meesa-beauty": "Meesa Beauty",
  "meesaya-murukku-masstamilan.com": "Meesaya Murukku",
  "megham-karukatha-masstamilan.dev": "Megham Karukatha",
  "mei-nigara": "Mei Nigara",
  "mersalayitten": null,
  "moongil-thottam": "Moongil Thottam",
  "mundhinam-parthene-masstamilan.com": "Mundhinam Parthene",
  "mudhal-nee-mudivum-nee-title-track-masstamilan.io": "Mudhal Nee Mudivum Nee",
  "naa-ready-masstamilan.dev": "Naa Ready",
  "naan-naan-masstamilan.fm": "Naan Naan",
  "nee-singam-dhan-masstamilan.dev": "Nee Singam Dhan",
  "nenjame-nenjame-masstamilan.dev": "Nenjame Nenjame",
  "nenjukkule": null,
  "nenjukulla-nee": "Nenjukulla Nee",
  "netru-aval-irundhal": "Netru Aval Irundhal",
  "new-york-nagaram": null,
  "nira-masstamilan.dev": "Nira",
  "oruthi-maelae-masstamilan.dev": "Oruthi Maelae",
  "osaka-osaka": "Osaka Osaka",
  "paalam": null,
  "otha-thamarai-original-soundtrack-masstamilan.dev": "Otha Thamarai",
  "pacha-elai-masstamilan.dev": "Pacha Elai",
  "pachai-kiligal": "Pachai Kiligal",
  "pakkam-vanthu": "Pakkam Vanthu",
  "pallikoodam-the-farewell-song-masstamilan.org": "Pallikoodam",
  "peelings": null,
  "poi-vazhva": "Poi Vazhva",
  "porkanda-singam-masstamilan.so": "Porkanda Singam",
  "polladha-boomi-masstamilan.org": "Polladha Boomi",
  "prabalamagavey": null,
  "quit-pannuda-masstamilan.io": "Quit Pannuda",
  "ratchasa-maamaney-masstamilan.dev": "Ratchasa Maamaney",
  "remo-nee-kadhalan": "Remo Nee Kadhalan",
  "rise-of-dragon": null,
  "saitji-saitji-masstamilan.com": "Saitji Saitji",
  "sawadeeka": null,
  "selfie-pulla": "Selfie Pulla",
  "sithira-puthiri-masstamilan.dev": "Sithira Puthiri",
  "single-pasanga-masstamilan.org": "Single Pasanga",
  "sonapareeya": null,
  "soodaana": "Soodana",
  "tamilselvi": "Tamizselvi",
  "thaarame-thaarame-masstamilan.io": "Thaarame Thaarame",
  "thaiyya-thaiyya": "Thaiyya Thaiyya",
  "thangame": null,
  "theansudare": null,
  "thenmozhi-masstamilan.dev": "Thenmozhi",
  "udhungada-sangu": null,
  "ullaallaa-masstamilan.org": "Ullaallaa",
  "unakku-thaan-masstamilan.dev": "Unakku Thaan",
  "un-mela-aasadhaan": "Un Mela Aasadhan",
  "unnai-kaanadhu-naan-1": "Unnai Kaanadhu Naan",
  "unnai-kaanadhu-naan": "Unnai Kaanadhu Naan",
  "usuru-narambula": "Usuru Narambula",
  "vaada-maappilley": null,
  "vaadi-nee-vaadi-masstamilan.com": "Vaadi Nee Vaadi",
  "vaathi-coming-masstamilan.io": "Vaathi Coming",
  "vaaya-en-veera": "Vaaya En Veera",
  "varava-varava": "Varava Varava",
  "vazhithunaiye": null,
  "veesum-velichathile": "Veesum Velichathile",
  "verithanam-masstamilan.io": "Verithanam",
  "water-packet": null,
  "what-a-karavad": null,
  "where-is-the-party": null,
  "yaanji-masstamilan.com": "Yaanji",
  "whistle-podu": null,
  "yaarenna-sonnalum-masstamilan.fm": "Yaarenna Sonnalum",
  "yathe-yathe": "Yathe Yathe",
  "yedi": null,
  "yennai-maatrum-kadhale": "Yennai Maatrum Kadhale",
};

const dropboxToMeta = {};
for (const [file, title] of Object.entries(fileOverrides)) {
  if (title) {
    const meta = metadata.find((m) => m.title.toLowerCase() === title.toLowerCase());
    if (meta) dropboxToMeta[file.toLowerCase()] = meta;
  }
}

async function main() {
  const snap = await db.collection("songs").get();
  const allSongs = snap.docs.map((d) => ({ ref: d.ref, id: d.id, ...d.data() }));
  console.log(`Found ${allSongs.length} songs\n`);

  let updated = 0;
  let notFound = 0;

  for (const song of allSongs) {
    const norm = (song.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    let meta = metaMap[norm];

    if (!meta && song.dropboxPath) {
      const file = song.dropboxPath.split("/").pop().replace(/\.[^/.]+$/, "").toLowerCase();
      meta = dropboxToMeta[file];
    }

    if (meta) {
      await song.ref.update({
        title: meta.title,
        artist: meta.artist,
        album: meta.album,
        genre: meta.genre,
        duration: meta.duration,
      });
      console.log(`  ${song.title} → ${meta.title} | ${meta.artist}`);
      updated++;
    } else {
      console.log(`  SKIP: ${song.title} (not in metadata list)`);
      notFound++;
    }
  }

  console.log(`\nDone! Updated: ${updated}, Not found: ${notFound}`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
