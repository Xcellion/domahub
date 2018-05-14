//<editor-fold>-------------------------------VARIABLES-------------------------------

var currency_codes = {
  "AED": {
    "name": "UAE Dirham",
    "fractionSize": 2,
    "symbol": {
      "grapheme": ".د.إ",
      "template": "1 $",
      "rtl": true
    },
    "uniqSymbol": null
  },
  "AFN": {
    "name": "Afghan Afghani",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "؋",
      "template": "1 $",
      "rtl": true
    },
    "uniqSymbol": {
      "grapheme": "؋",
      "template": "1 $",
      "rtl": true
    }
  },
  "ALL": {
    "name": "Albanian Lek",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "L",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "Lek",
      "template": "$1",
      "rtl": false
    }
  },
  "AMD": {
    "name": "Armenian Dram",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "դր.",
      "template": "1 $",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "դր.",
      "template": "1 $",
      "rtl": false
    }
  },
  "ANG": {
    "name": "Netherlands Antillean Guilder",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "ƒ",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "NAƒ",
      "template": "$1",
      "rtl": false
    }
  },
  "AOA": {
    "name": "Angolan Kwanza",
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "ARS": {
    "name": "Argentine Peso",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "$",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": null
  },
  "AUD": {
    "name": "Australian Dollar",
    "paypalFee": 0.3,
    "fractionSize": 2,
    "symbol": {
      "grapheme": "$",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "A$",
      "template": "$1",
      "rtl": false
    }
  },
  "AWG": {
    "name": "Aruban Florin",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "ƒ",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "Afl",
      "template": "$1",
      "rtl": false
    }
  },
  "AZN": {
    "name": "Azerbaijanian Manat",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "₼",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "₼",
      "template": "$1",
      "rtl": false
    }
  },
  "BAM": {
    "name": "Convertible Mark",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "KM",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "KM",
      "template": "$1",
      "rtl": false
    }
  },
  "BBD": {
    "name": "Barbados Dollar",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "$",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": null
  },
  "BDT": {
    "name": "Bangladeshi Taka",
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "BGN": {
    "name": "Bulgarian Lev",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "лв",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "лв",
      "template": "$1",
      "rtl": false
    }
  },
  "BHD": {
    "name": "Bahraini Dinar",
    "fractionSize": 3,
    "symbol": {
      "grapheme": ".د.ب",
      "template": "1 $",
      "rtl": true
    },
    "uniqSymbol": {
      "grapheme": ".د.ب",
      "template": "1 $",
      "rtl": true
    }
  },
  "BIF": {
    "name": "Burundi Franc",
    "fractionSize": 0,
    "symbol": null,
    "uniqSymbol": null
  },
  "BMD": {
    "name": "Bermudian Dollar",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "$",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "BD$",
      "template": "$1",
      "rtl": false
    }
  },
  "BND": {
    "name": "Brunei Dollar",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "$",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": null
  },
  "BOB": {
    "name": "Bolivia Boliviano",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "Bs.",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "Bs.",
      "template": "$1",
      "rtl": false
    }
  },
  "BOV": {
    "name": "Bolivian Mvdol",
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "BRL": {
    "name": "Brazilian Real",
    "paypalFee": 0.6,
    "fractionSize": 2,
    "symbol": {
      "grapheme": "R$",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "R$",
      "template": "$1",
      "rtl": false
    }
  },
  "BSD": {
    "name": "Bahamian Dollar",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "$",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": null
  },
  "BTN": {
    "name": "Bhutanese Ngultrum",
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "BWP": {
    "name": "Botswana Pula",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "P",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "P",
      "template": "$1",
      "rtl": false
    }
  },
  "BYN": {
    "name": "Belarussian Ruble",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "p.",
      "template": "1 $",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "р.",
      "template": "1 $",
      "rtl": false
    }
  },
  "BYR": {
    "name": "Belarussian Ruble",
    "fractionSize": 0,
    "symbol": {
      "grapheme": "p.",
      "template": "1 $",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "р.",
      "template": "1 $",
      "rtl": false
    }
  },
  "BZD": {
    "name": "Belize Dollar",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "BZ$",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "BZ$",
      "template": "$1",
      "rtl": false
    }
  },
  "CAD": {
    "name": "Canadian Dollar",
    "paypalFee": 0.3,
    "fractionSize": 2,
    "symbol": {
      "grapheme": "$",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "CA$",
      "template": "$1",
      "rtl": false
    }
  },
  "CDF": {
    "name": "Congolese Franc",
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "CHE": {
    "name": "WIR Euro",
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "CHF": {
    "name": "Swiss Franc",
    "paypalFee": 0.55,
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "CHW": {
    "name": "WIR Franc",
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "CLF": {
    "name": "Unidad de Fomento",
    "fractionSize": 4,
    "symbol": null,
    "uniqSymbol": null
  },
  "CLP": {
    "name": "Chilean Peso",
    "fractionSize": 0,
    "symbol": {
      "grapheme": "$",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": null
  },
  "CNY": {
    "name": "Yuan Renminbi",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "元",
      "template": "1 $",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "元",
      "template": "1 $",
      "rtl": false
    }
  },
  "COP": {
    "name": "Colombian Peso",
    "fractionSize": 0,
    "symbol": {
      "grapheme": "$",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": null
  },
  "COU": {
    "name": "Unidad de Valor Real",
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "CRC": {
    "name": "Cost Rican Colon",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "₡",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "₡",
      "template": "$1",
      "rtl": false
    }
  },
  "CUC": {
    "name": "Peso Convertible",
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "CUP": {
    "name": "Cuban Peso",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "$MN",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "$MN",
      "template": "$1",
      "rtl": false
    }
  },
  "CVE": {
    "name": "Cabo Verde Escudo",
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "CZK": {
    "name": "Czech Koruna",
    "paypalFee": 10,
    "fractionSize": 2,
    "symbol": {
      "grapheme": "Kč",
      "template": "1 $",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "Kč",
      "template": "1 $",
      "rtl": false
    }
  },
  "DJF": {
    "name": "Djibouti Franc",
    "fractionSize": 0,
    "symbol": null,
    "uniqSymbol": null
  },
  "DKK": {
    "name": "Danish Krone",
    "paypalFee": 2.6,
    "fractionSize": 2,
    "symbol": {
      "grapheme": "kr",
      "template": "1 $",
      "rtl": false
    },
    "uniqSymbol": null
  },
  "DOP": {
    "name": "Dominican Peso",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "RD$",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "RD$",
      "template": "$1",
      "rtl": false
    }
  },
  "DZD": {
    "name": "Algerian Dinar",
    "fractionSize": 2,
    "symbol": {
      "grapheme": ".د.ج",
      "template": "1 $",
      "rtl": true
    },
    "uniqSymbol": {
      "grapheme": ".د.ج",
      "template": "1 $",
      "rtl": true
    }
  },
  "EEK": {
    "name": "Estonian Kroon",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "kr",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": null
  },
  "EGP": {
    "name": "Egyptian Pound",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "£",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": ".ج.م",
      "template": "1 $",
      "rtl": true
    }
  },
  "ERN": {
    "name": "Eritrean Nakfa",
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "ETB": {
    "name": "Ethiopian Birr",
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "EUR": {
    "name": "Euro",
    "paypalFee": 0.35,
    "fractionSize": 2,
    "symbol": {
      "grapheme": "€",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "€",
      "template": "$1",
      "rtl": false
    }
  },
  "FJD": {
    "name": "Fiji Dollar",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "$",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "FJ$",
      "template": "$1",
      "rtl": false
    }
  },
  "FKP": {
    "name": "Falkland Islands Pound",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "£",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": null
  },
  "GBP": {
    "name": "Pound Sterling",
    "paypalFee": 0.2,
    "fractionSize": 2,
    "symbol": {
      "grapheme": "£",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "£",
      "template": "$1",
      "rtl": false
    }
  },
  "GEL": {
    "name": "Georgian Lari",
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "GGP": {
    "name": "Guernsey Pound",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "£",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": null
  },
  "GHC": {
    "name": "Ghanaian Cedi",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "¢",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "¢",
      "template": "$1",
      "rtl": false
    }
  },
  "GHS": {
    "name": "Ghan Cedi",
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "GIP": {
    "name": "Gibraltar Pound",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "£",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": null
  },
  "GMD": {
    "name": "Gambian Dalasi",
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "GNF": {
    "name": "Guine Franc",
    "fractionSize": 0,
    "symbol": null,
    "uniqSymbol": null
  },
  "GTQ": {
    "name": "Guatemalan Quetzal",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "Q",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "Q",
      "template": "$1",
      "rtl": false
    }
  },
  "GYD": {
    "name": "Guyan Dollar",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "$",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "GY$",
      "template": "$1",
      "rtl": false
    }
  },
  "HKD": {
    "name": "Hong Kong Dollar",
    "paypalFee": 2.35,
    "fractionSize": 2,
    "symbol": {
      "grapheme": "$",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "HK$",
      "template": "$1",
      "rtl": false
    }
  },
  "HNL": {
    "name": "Honduran Lempira",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "L",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "L",
      "template": "$1",
      "rtl": false
    }
  },
  "HRK": {
    "name": "Croatian Kuna",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "kn",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "kn",
      "template": "$1",
      "rtl": false
    }
  },
  "HTG": {
    "name": "Haitian Gourde",
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "HUF": {
    "name": "Hungarian Forint",
    "paypalFee": 90,
    "fractionSize": 0,
    "symbol": {
      "grapheme": "Ft",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "Ft",
      "template": "$1",
      "rtl": false
    }
  },
  "IDR": {
    "name": "Indonesian Rupiah",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "Rp",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "Rp",
      "template": "$1",
      "rtl": false
    }
  },
  "ILS": {
    "name": "New Israeli Sheqel",
    "paypalFee": 1.2,
    "fractionSize": 2,
    "symbol": {
      "grapheme": "₪",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "₪",
      "template": "$1",
      "rtl": false
    }
  },
  "IMP": {
    "name": "Manx Pound",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "£",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": null
  },
  "INR": {
    "name": "Indian Rupee",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "₹",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "₹",
      "template": "$1",
      "rtl": false
    }
  },
  "IQD": {
    "name": "Iraqi Dinar",
    "fractionSize": 3,
    "symbol": {
      "grapheme": ".د.ع",
      "template": "1 $",
      "rtl": true
    },
    "uniqSymbol": {
      "grapheme": ".د.ع",
      "template": "1 $",
      "rtl": true
    }
  },
  "IRR": {
    "name": "Iranian Rial",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "﷼",
      "template": "1 $",
      "rtl": true
    },
    "uniqSymbol": {
      "grapheme": "﷼",
      "template": "1 $",
      "rtl": true
    }
  },
  "ISK": {
    "name": "Iceland Krona",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "kr",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": null
  },
  "JEP": {
    "name": "Jersey Pound",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "£",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": null
  },
  "JMD": {
    "name": "Jamaican Dollar",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "J$",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "J$",
      "template": "$1",
      "rtl": false
    }
  },
  "JOD": {
    "name": "Jordanian Dinar",
    "fractionSize": 3,
    "symbol": {
      "grapheme": ".د.إ",
      "template": "1 $",
      "rtl": true
    },
    "uniqSymbol": null
  },
  "JPY": {
    "name": "Japanese Yen",
    "paypalFee": 40,
    "fractionSize": 0,
    "symbol": {
      "grapheme": "¥",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "¥",
      "template": "$1",
      "rtl": false
    }
  },
  "KES": {
    "name": "Kenyan Shilling",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "KSh",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "KSh",
      "template": "$1",
      "rtl": false
    }
  },
  "KGS": {
    "name": "Kyrgyzstani Som",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "сом",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "сом",
      "template": "$1",
      "rtl": false
    }
  },
  "KHR": {
    "name": "Cambodian Riel",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "៛",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "៛",
      "template": "$1",
      "rtl": false
    }
  },
  "KMF": {
    "name": "Comoro Franc",
    "fractionSize": 0,
    "symbol": null,
    "uniqSymbol": null
  },
  "KPW": {
    "name": "North Korean Won",
    "fractionSize": 0,
    "symbol": {
      "grapheme": "₩",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": null
  },
  "KRW": {
    "name": "South Korean Won",
    "fractionSize": 0,
    "symbol": {
      "grapheme": "₩",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "₩",
      "template": "$1",
      "rtl": false
    }
  },
  "KWD": {
    "name": "Kuwaiti Dinar",
    "fractionSize": 3,
    "symbol": {
      "grapheme": ".د.ك",
      "template": "1 $",
      "rtl": true
    },
    "uniqSymbol": {
      "grapheme": ".د.ك",
      "template": "1 $",
      "rtl": true
    }
  },
  "KYD": {
    "name": "Cayman Islands Dollar",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "$",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "CI$",
      "template": "$1",
      "rtl": false
    }
  },
  "KZT": {
    "name": "Kazakhstani Tenge",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "₸",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "₸",
      "template": "$1",
      "rtl": false
    }
  },
  "LAK": {
    "name": "Lao Kip",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "₭",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "₭",
      "template": "$1",
      "rtl": false
    }
  },
  "LBP": {
    "name": "Lebanese Pound",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "£",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": ".ل.ل",
      "template": "1 $",
      "rtl": true
    }
  },
  "LKR": {
    "name": "Sri Lank Rupee",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "₨",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": null
  },
  "LRD": {
    "name": "Liberian Dollar",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "$",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "L$",
      "template": "$1",
      "rtl": false
    }
  },
  "LSL": {
    "name": "Lesotho Loti",
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "LTL": {
    "name": "Lithuanian Litas",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "Lt",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "Lt",
      "template": "$1",
      "rtl": false
    }
  },
  "LVL": {
    "name": "Latvian Lats",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "Ls",
      "template": "1 $",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "Ls",
      "template": "1 $",
      "rtl": false
    }
  },
  "LYD": {
    "name": "Libyan Dinar",
    "fractionSize": 3,
    "symbol": {
      "grapheme": ".د.ل",
      "template": "1 $",
      "rtl": true
    },
    "uniqSymbol": {
      "grapheme": ".د.ل",
      "template": "1 $",
      "rtl": true
    }
  },
  "MAD": {
    "name": "Moroccan Dirham",
    "fractionSize": 2,
    "symbol": {
      "grapheme": ".د.م",
      "template": "1 $",
      "rtl": true
    },
    "uniqSymbol": {
      "grapheme": ".د.م",
      "template": "1 $",
      "rtl": true
    }
  },
  "MDL": {
    "name": "Moldovan Leu",
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "MGA": {
    "name": "Malagasy ariary",
    "fractionSize": 0,
    "symbol": null,
    "uniqSymbol": null
  },
  "MKD": {
    "name": "Macedonian Denar",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "ден",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "ден",
      "template": "$1",
      "rtl": false
    }
  },
  "MMK": {
    "name": "Myanmar Kyat",
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "MNT": {
    "name": "Mongolian Tugrik",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "₮",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "₮",
      "template": "$1",
      "rtl": false
    }
  },
  "MOP": {
    "name": "Macanese Pataca",
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "MRO": {
    "name": "Mauritanian Ouguiya",
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "MUR": {
    "name": "Mauritius Rupee",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "₨",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": null
  },
  "MVR": {
    "name": "Maldivian Rufiyaa",
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "MWK": {
    "name": "Malawian Kwacha",
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "MXN": {
    "name": "Mexican Peso",
    "paypalFee": 4,
    "fractionSize": 2,
    "symbol": {
      "grapheme": "$",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": null
  },
  "MXV": {
    "name": "Mexican Unidad de Inversion (UDI)",
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "MYR": {
    "name": "Malaysian Ringgit",
    "paypalFee": 2,
    "fractionSize": 2,
    "symbol": {
      "grapheme": "RM",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "RM",
      "template": "$1",
      "rtl": false
    }
  },
  "MZN": {
    "name": "Mozambique Metical",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "MT",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "MT",
      "template": "$1",
      "rtl": false
    }
  },
  "NAD": {
    "name": "Namibi Dollar",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "$",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "N$",
      "template": "$1",
      "rtl": false
    }
  },
  "NGN": {
    "name": "Nigerian Naira",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "₦",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "₦",
      "template": "$1",
      "rtl": false
    }
  },
  "NIO": {
    "name": "Cordob Oro",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "C$",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "C$",
      "template": "$1",
      "rtl": false
    }
  },
  "NOK": {
    "name": "Norwegian Krone",
    "paypalFee": 2.8,
    "fractionSize": 2,
    "symbol": {
      "grapheme": "kr",
      "template": "1 $",
      "rtl": false
    },
    "uniqSymbol": null
  },
  "NPR": {
    "name": "Nepalese Rupee",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "₨",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": null
  },
  "NZD": {
    "name": "New Zealand Dollar",
    "paypalFee": 0.45,
    "fractionSize": 2,
    "symbol": {
      "grapheme": "$",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "NZ$",
      "template": "$1",
      "rtl": false
    }
  },
  "OMR": {
    "name": "Rial Omani",
    "fractionSize": 3,
    "symbol": {
      "grapheme": "﷼",
      "template": "1 $",
      "rtl": true
    },
    "uniqSymbol": {
      "grapheme": ".ر.ع",
      "template": "1 $",
      "rtl": true
    }
  },
  "PAB": {
    "name": "Panamanian Balboa",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "B/.",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "B/.",
      "template": "$1",
      "rtl": false
    }
  },
  "PEN": {
    "name": "Nuevo Sol",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "S/",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "S/",
      "template": "$1",
      "rtl": false
    }
  },
  "PGK": {
    "name": "Papua New Guinean Kina",
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "PHP": {
    "name": "Philippine Peso",
    "paypalFee": 15,
    "fractionSize": 2,
    "symbol": {
      "grapheme": "₱",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "₱",
      "template": "$1",
      "rtl": false
    }
  },
  "PKR": {
    "name": "Pakistan Rupee",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "₨",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": null
  },
  "PLN": {
    "name": "Polish Zloty",
    "paypalFee": 1.35,
    "fractionSize": 2,
    "symbol": {
      "grapheme": "zł",
      "template": "1 $",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "zł",
      "template": "1 $",
      "rtl": false
    }
  },
  "PYG": {
    "name": "Paraguayan Guarani",
    "fractionSize": 0,
    "symbol": {
      "grapheme": "Gs",
      "template": "1$",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "Gs",
      "template": "1$",
      "rtl": false
    }
  },
  "QAR": {
    "name": "Qatari Rial",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "﷼",
      "template": "1 $",
      "rtl": true
    },
    "uniqSymbol": {
      "grapheme": ".ر.ق",
      "template": "1 $",
      "rtl": true
    }
  },
  "RON": {
    "name": "New Romanian Leu",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "lei",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "lei",
      "template": "$1",
      "rtl": false
    }
  },
  "RSD": {
    "name": "Serbian Dinar",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "Дин.",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "Дин.",
      "template": "$1",
      "rtl": false
    }
  },
  "RUB": {
    "name": "Russian Ruble",
    "paypalFee": 10,
    "fractionSize": 2,
    "symbol": {
      "grapheme": "₽",
      "template": "1 $",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "₽",
      "template": "1 $",
      "rtl": false
    }
  },
  "RUR": {
    "name": "Russian Ruble",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "₽",
      "template": "1 $",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "₽",
      "template": "1 $",
      "rtl": false
    }
  },
  "RWF": {
    "name": "Rwand Franc",
    "fractionSize": 0,
    "symbol": null,
    "uniqSymbol": null
  },
  "SAR": {
    "name": "Saudi Riyal",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "﷼",
      "template": "1 $",
      "rtl": true
    },
    "uniqSymbol": {
      "grapheme": ".ر.س",
      "template": "1 $",
      "rtl": true
    }
  },
  "SBD": {
    "name": "Solomon Islands Dollar",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "$",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "SI$",
      "template": "$1",
      "rtl": false
    }
  },
  "SCR": {
    "name": "Seychelles Rupee",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "₨",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": null
  },
  "SDG": {
    "name": "Sudanese Pound",
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "SEK": {
    "name": "Swedish Krona",
    "paypalFee": 3.25,
    "fractionSize": 2,
    "symbol": {
      "grapheme": "kr",
      "template": "1 $",
      "rtl": false
    },
    "uniqSymbol": null
  },
  "SGD": {
    "name": "Singapore Dollar",
    "paypalFee": 0.5,
    "fractionSize": 2,
    "symbol": {
      "grapheme": "$",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "S$",
      "template": "$1",
      "rtl": false
    }
  },
  "SHP": {
    "name": "Saint Helen Pound",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "£",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": null
  },
  "SLL": {
    "name": "Sierra Leonean Leone",
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "SOS": {
    "name": "Somali Shilling",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "S",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "S",
      "template": "$1",
      "rtl": false
    }
  },
  "SRD": {
    "name": "Surinam Dollar",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "$",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": null
  },
  "SSP": {
    "name": "South Sudanese Pound",
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "STD": {
    "name": "São Tomé and Príncipe Dobra",
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "SVC": {
    "name": "El Salvador Colon",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "$",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "C",
      "template": "$1",
      "rtl": false
    }
  },
  "SYP": {
    "name": "Syrian Pound",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "£",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": ".ل.س",
      "template": "1 $",
      "rtl": true
    }
  },
  "SZL": {
    "name": "Swazi Lilangeni",
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "THB": {
    "name": "Thai Baht",
    "paypalFee": 11,
    "fractionSize": 2,
    "symbol": {
      "grapheme": "฿",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "฿",
      "template": "$1",
      "rtl": false
    }
  },
  "TJS": {
    "name": "Tajikistani Somoni",
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "TMT": {
    "name": "Turkmenistan New Manat",
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "TND": {
    "name": "Tunisian Dinar",
    "fractionSize": 3,
    "symbol": {
      "grapheme": ".د.ت",
      "template": "1 $",
      "rtl": true
    },
    "uniqSymbol": {
      "grapheme": ".د.ت",
      "template": "1 $",
      "rtl": true
    }
  },
  "TOP": {
    "name": "Tongan Pa’anga",
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "TRL": {
    "name": "Turkish Lira",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "₤",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": null
  },
  "TRY": {
    "name": "Turkish Lira",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "₺",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "₺",
      "template": "$1",
      "rtl": false
    }
  },
  "TTD": {
    "name": "Trinidad and Tobago Dollar",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "TT$",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "TT$",
      "template": "$1",
      "rtl": false
    }
  },
  "TWD": {
    "name": "New Taiwan Dollar",
    "paypalFee": 10,
    "fractionSize": 0,
    "symbol": {
      "grapheme": "NT$",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "NT$",
      "template": "$1",
      "rtl": false
    }
  },
  "TZS": {
    "name": "Tanzanian Shilling",
    "fractionSize": 0,
    "symbol": {
      "grapheme": "TSh",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "TSh",
      "template": "$1",
      "rtl": false
    }
  },
  "UAH": {
    "name": "Ukrainian Hryvnia",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "₴",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "₴",
      "template": "$1",
      "rtl": false
    }
  },
  "UGX": {
    "name": "Ugand Shilling",
    "fractionSize": 0,
    "symbol": {
      "grapheme": "USh",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "USh",
      "template": "$1",
      "rtl": false
    }
  },
  "USD": {
    "name": "United States Dollar",
    "paypalFee": 0.3,
    "fractionSize": 2,
    "symbol": {
      "grapheme": "$",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "$",
      "template": "$1",
      "rtl": false
    }
  },
  "USN": {
    "name": "United States Dollar (Next day)",
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "UYI": {
    "name": "Uruguay Peso en Unidades Indexadas (URUIURUI)",
    "fractionSize": 0,
    "symbol": null,
    "uniqSymbol": null
  },
  "UYU": {
    "name": "Peso Uruguayo",
    "fractionSize": 0,
    "symbol": {
      "grapheme": "$U",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "$U",
      "template": "$1",
      "rtl": false
    }
  },
  "UZS": {
    "name": "Uzbekistan Sum",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "so’m",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "so’m",
      "template": "$1",
      "rtl": false
    }
  },
  "VEF": {
    "name": "Venezuelan Bolivar",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "Bs",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "Bs",
      "template": "$1",
      "rtl": false
    }
  },
  "VND": {
    "name": "Vietnamese Dong",
    "fractionSize": 0,
    "symbol": {
      "grapheme": "₫",
      "template": "1 $",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "₫",
      "template": "1 $",
      "rtl": false
    }
  },
  "VUV": {
    "name": "Vanuatu Vatu",
    "fractionSize": 0,
    "symbol": null,
    "uniqSymbol": null
  },
  "WST": {
    "name": "Samoan Tala",
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "XAF": {
    "name": "CFA Franc BEAC",
    "fractionSize": 0,
    "symbol": {
      "grapheme": "F CFA",
      "template": "1 $",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "F CFA",
      "template": "1 $",
      "rtl": false
    }
  },
  "XCD": {
    "name": "East Caribbean Dollar",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "$",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "EC$",
      "template": "$1",
      "rtl": false
    }
  },
  "XDR": {
    "name": "SDR (Special Drawing Right)",
    "fractionSize": 0,
    "symbol": null,
    "uniqSymbol": null
  },
  "XOF": {
    "name": "CFA Franc BCEAO",
    "fractionSize": 0,
    "symbol": {
      "grapheme": "CFA",
      "template": "1 $",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "F CFA BCEAO",
      "template": "1 $",
      "rtl": false
    }
  },
  "XPF": {
    "name": "CFP Franc",
    "fractionSize": 0,
    "symbol": null,
    "uniqSymbol": null
  },
  "XSU": {
    "name": "SUCRE",
    "fractionSize": 0,
    "symbol": null,
    "uniqSymbol": null
  },
  "XUA": {
    "name": "ADB Unit of Account",
    "fractionSize": 0,
    "symbol": null,
    "uniqSymbol": null
  },
  "YER": {
    "name": "Yemeni Rial",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "﷼",
      "template": "1 $",
      "rtl": true
    },
    "uniqSymbol": {
      "grapheme": ".ر.ي",
      "template": "1 $",
      "rtl": true
    }
  },
  "ZAR": {
    "name": "South African Rand",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "R",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "R",
      "template": "$1",
      "rtl": false
    }
  },
  "ZMW": {
    "name": "Zambian Kwacha",
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "ZWD": {
    "name": "Zimbabwe Dollar",
    "fractionSize": 2,
    "symbol": {
      "grapheme": "Z$",
      "template": "$1",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "Z$",
      "template": "$1",
      "rtl": false
    }
  },
  "ZWL": {
    "name": "Zimbabwe Dollar",
    "fractionSize": 2,
    "symbol": null,
    "uniqSymbol": null
  },
  "BTC": {
    "name": "BTC",
    "fractionSize": 4,
    "symbol": {
      "grapheme": "₿",
      "template": "1 $",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "₿",
      "template": "1 $",
      "rtl": false
    }
  },
  "ETH": {
    "name": "ETH",
    "fractionSize": 4,
    "symbol": {
      "grapheme": "Ξ",
      "template": "1 $",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "Ξ",
      "template": "1 $",
      "rtl": false
    }
  },
  "LTC": {
    "name": "LTC",
    "fractionSize": 4,
    "symbol": {
      "grapheme": "Ł",
      "template": "1 $",
      "rtl": false
    },
    "uniqSymbol": {
      "grapheme": "Ł",
      "template": "1 $",
      "rtl": false
    }
  }
}

var fx = require('money');
var oxr = require('open-exchange-rates');
oxr.set({app_id : "11abe8e106f943c59a206509f5f10f9c"});
var wNumb = require("wnumb");

var moment = require('moment');
var fs = require('fs');

//</editor-fold>

module.exports = {

  //return all currencies
  all : function(){
    return currency_codes;
  },

  //returns if a currency exists
  exists : function(code){
    return typeof currency_codes[code.toUpperCase()] != "undefined";
  },

  //returns the multiplier given a currency
  multiplier : function(code){
    return (code && currency_codes[code.toUpperCase()]) ? Math.pow(10, currency_codes[code.toUpperCase()].fractionSize) : 1;
  },

  //formats a number for currency + readability
  format : function(amount, code){
    var default_currency_details = (code) ? currency_codes[code.toUpperCase()] : currency_codes["USD"];
    var currency_details = {
      thousand: ',',
      decimals: default_currency_details.fractionSize,
    }

    //right aligned symbol
    if (default_currency_details.symbol && default_currency_details.symbol.rtl){
      currency_details.suffix = default_currency_details.symbol.grapheme;
    }
    else if (default_currency_details.symbol && !default_currency_details.symbol.rtl){
      currency_details.prefix = default_currency_details.symbol.grapheme;
    }

    return wNumb(currency_details).to(amount / Math.pow(10, default_currency_details.fractionSize));
  },

  //from one currency to another
  exchange : function(amount, from, to){
    return fx(amount).from(from.toUpperCase()).to(to.toUpperCase());
  },

  //any paypal fees?
  paypalFee : function(code){
    return (currency_codes[code].paypalFee) ? currency_codes[code].paypalFee : false;
  },

  //check if current exchange rates are legit, if not update to today's exchange rates
  checkExchangeRates : function(req, res, next){
    console.log("CF: Checking exchange rates...");

    var current_exchange_rates = JSON.parse(fs.readFileSync(__dirname + "/current-exchange-rates.json"));

    //if exchange rates are still good (last time rates gotten is less than an hour)
    if (process.env.NODE_ENV != "dev" && current_exchange_rates && current_exchange_rates.date && moment.duration(moment().diff(moment(current_exchange_rates.date))).asHours() < 1){
      fx.rates = current_exchange_rates.rates;
    	fx.base = current_exchange_rates.base;

      next();
    }
    else {
      oxr.latest(function() {
        var current_exchange_rates = {
          rates : oxr.rates,
          base : oxr.base,
          date : moment().format("YYYY-MM-DD HH:mm")
        }

        //rewrite old file
        fs.writeFileSync(__dirname + "/current-exchange-rates.json", JSON.stringify(current_exchange_rates, null, 4), "utf8");
        fx.rates = current_exchange_rates.rates;
      	fx.base = current_exchange_rates.base;
      });

      next();
    }
  },
}
