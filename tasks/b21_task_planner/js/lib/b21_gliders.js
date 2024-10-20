// B21_GLIDERS is used to provide 'standard' data for MSFS gliders, including normalising the glider_type
// Static class providec methods:
//
// find_glider_type(title_str) - returns glider_type or ""
// lookup(glider_type, key) - returns matching property in B21_GLIDERS_DATA

// Note TITLE_STRS should be LOWER CASE
var B21_GLIDERS_DATA = {
        "AS-33": {
            "TITLE_STRS": [ "as33", "as-33" ],
            "NB21_ACFG": [ "128D63EA22585AA47C381FC8",
                        "21735116C3548A2C1B61D69B",
                        "0C26C63E4D7FAD13BC406545"
            ],
            "NB21_FMCG": [ "1B0477A5B0103B6FBBB971A6"
            ],
            "MAX_WEIGHT_KG": 600,
            "VNE_TAS_KPH": 282
        },
        "ASW28": {
            "TITLE_STRS": [ "asw28", "asw-28" ],
            "MAX_WEIGHT_KG": 525,
            "VNE_TAS_KPH": 282
        },
        "JS3-18": {
            "TITLE_STRS": [ "js3-18" ],
            "NB21_ACFG": [ "753B807E002326612ACFA3A3"
            ],
            "NB21_FMCG": [ "5395E12E6384EABE7B636C6F"
            ],
            "MAX_WEIGHT_KG": 600,
            "VNE_TAS_KPH": 292
        },
        "JS3-15": {
            "TITLE_STRS": [ "js3-15" ],
            "NB21_ACFG": [ "14E993B8CAA8350EF404F92C",
                        "A51D14335FA6C71DBF197FEB"
            ],
            "NB21_FMCG": [ "350C66E7F8C644AC30537D6B"
            ],
            "MAX_WEIGHT_KG": 525,
            "VNE_TAS_KPH": 292
        },
        "LS4": {
            "TITLE_STRS": [ "ls4" ],
            "NB21_ACFG": [ "A48A4EF4E2A9D96C843B4361",
                        '067AD89CAA95B9D8F2104D3C'
            ],
            "NB21_FMCG": [ "2CF10E6AEDEF85C111F41401",
                        '49297C175A997216905BE06D'
            ],
            "MAX_WEIGHT_KG": 525,
            "VNE_TAS_KPH": 282
        },
        "DG808S": {
            "TITLE_STRS": [ "dg808" ],
            "NB21_ACFG": [ "0D933FB14EC7C1FC5E9C50FF",
                        '617D8901FFC57865966C1A42',
                        'AD2A2DAE9489BE555A943A0B',
                        '7E3FC6A03E66257D41360809'
            ],
            "NB21_FMCG": [ "612014C72D2B9816C06CB778",
                        '8BDD0288671E70B14A3F9944',
                        'D44F8E99540D500341A45DE0'
            ],
            "MAX_WEIGHT_KG": 600,
            "VNE_TAS_KPH": 282
        },
        "AS7": {
            "TITLE_STRS": [ "as7", " k7", "k7 " ],
            "NB21_ACFG": [ "0CF71B19CD5135728AE56972"
            ],
            "NB21_FMCG": [ "51EF38E151AAAFAA8D56AB13"
            ],
            "MAX_WEIGHT_KG": 484.5,
            "VNE_TAS_KPH": 209
        },
        "D2C": {
            "TITLE_STRS": [ "d2c", "discus" ],
            "NB21_ACFG": [ "3E0C44899BFAE022333DD031"
            ],
            "NB21_FMCG": [ "9423DEDB0380C1A9D482080A",
                        'F5F9FFE0AC73623470D0D39A',
                        'F310F9D3DEEA4B5B90CBD29B', // 2.0.8
                        'F09A18F3A4B0A1DD95A8308E', // 2.1.0
                        '0D3E5A401F352EE566C53109' // engine?
            ],
            "MAX_WEIGHT_KG": 565,
            "VNE_TAS_KPH": 292
        },
        "Asobo_LS8": {
            "TITLE_STRS": [ "ls8", "mxs" ],
            "NB21_ACFG": [ "3B42B4378BE570DF675D2363F",
                        '913A154DD71DB358BC981B3A'
            ],
            "NB21_FMCG": [ "1101DA2C71E9B25D1363D936",
                        'E9CC0A261EFB7FB1449287ED'
            ],
            "MAX_WEIGHT_KG": 575,
            "VNE_TAS_KPH": 292
        },
        "DGF": {
            "TITLE_STRS": [ "dgf", "dg1001" ],
            "NB21_ACFG": [ "CA728979D50E2D4E1B413891"
            ],
            "NB21_FMCG": [ "AEDA50561766217B28C244B7"
            ],
            "MAX_WEIGHT_KG": 750,
            "VNE_TAS_KPH": 282
        },
        "T31": {
            "TITLE_STRS": [ "t31" ],
            "MAX_WEIGHT_KG": 376,
            "VNE_TAS_KPH": 292
        },
        "SZD30": {
            "TITLE_STRS": [ "szd30", "szd-30", "pirat", "yanosik" ],
            "NB21_ACFG": [ '5A6A99C67F3A928DC2954647', // 1.0
                        'B586C65483CE078AD2254383' // B21 1.1.1
            ],
            "NB21_FMCG": [ '5FA5FE53894E11284FD6FEF2', // 1.0
                        'FB56C6A897F6088BA3446CC9' // EPPR 1.1
            ],
            "MAX_WEIGHT_KG": 370,
            "VNE_TAS_KPH": 204
        },
        "S12G": {
            "TITLE_STRS": ["stemme", "s12g"],
            "MAX_WEIGHT_KG": 900,
            "VNE_TAS_KPH": 282
        },
        "ASK21": {
            "TITLE_STRS": ["ask21", "ask-21", "k21"],
            "MAX_WEIGHT_KG": 600,
            "VNE_TAS_KPH": 292,
            "NB21_ACFG": [ '0D80744D55C63B52D3858C4B', // 1.0
                        'CFBF0C2E620475F9DA335EDB', // 1.0 aero
                        '4752A186F3309FCDA2C89F70', // 1.05
                        '1DD715876D3E401A6CF62849',  // 1.05 aero
                        'F3AAD1FD4395E298FD9AC5AE' // 1.3.0
            ],
            "NB21_FMCG": [ 'CD2F043264848184C4B6D089', // 1.0 base & aero
                        '83B3D349102683CAAF23034A', // 1.05 base & aero
                        '548E2BA6550F987325F6D92D', // 1.2.0
                        '13D7A87B12889FDFE376F49E' // 1.3.0
            ]
        },
        "Taurus": {
            "TITLE_STRS": ["taurus", "pipistrel"],
            "MAX_WEIGHT_KG": 550,
            "VNE_TAS_KPH": 282
        }
    }; // end glider_data

class B21_GLIDERS {

    constructor() {
    }


    // Onlyy used inside B21_GLIDERS
    static lookup(glider_type, key) {
        let id = glider_type;
        if (B21_GLIDERS[id] == null) {
            // That glider id not found, so search using title strings
            id = B21_GLIDERS.find_glider_type(id);
        }
        return B21_GLIDERS_DATA[id][key];
    }

    static check_key(glider_type, event_key, chksum) {
        let chksums = B21_GLIDERS.lookup(glider_type, "NB21_"+event_key);
        if (chksums == null) {
            return null;
        }
        for (let i=0;i<chksums.length;i++) {
            if (chksums[i] == chksum) {
                return i;
            }
        }
        return null;
    }

    // Here's our plane-mapping code because MSFS does it so badly
    static find_glider_type(title_str) {

        let title_str_lc = title_str.toLowerCase();

        for (const [glider_type, glider_entry] of Object.entries(B21_GLIDERS_DATA)) {

            for (let i=0; i<glider_entry.TITLE_STRS.length; i++) {
                if (title_str_lc.includes(glider_entry.TITLE_STRS[i])) {
                    return glider_type;
                }
            }
        }

        return "";
    }

    static get_glider_data(glider_type) {
        console.log(`B21_GLIDERS.get_glider_type '${glider_type}'`);
        if (B21_GLIDERS_DATA[glider_type] != null) {
            console.log(`B21_GLIDERS.get_glider_type '${glider_type} immediate success'`);
            return B21_GLIDERS_DATA[glider_type];
        }
        let gtype = B21_GLIDERS.find_glider_type(glider_type);
        if (gtype == "") {
            console.log(`B21_GLIDERS.get_glider_type '${glider_type}' find_glider_type failed`);
            return null;
        }
        console.log(`B21_GLIDERS.get_glider_type '${gtype}' returning glider_data `);
        return B21_GLIDERS_DATA[gtype];
    }
} // end class B21_GLIDERS
