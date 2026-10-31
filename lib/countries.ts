// Source: Worldometer "Population by Country (2026)" (UN World Population Prospects 2024),
// https://www.worldometers.info/world-population/population-by-country/
// Format per line:  ISO-3166 alpha-2 | display name | population
const RAW = `
IN|India|1476625576
CN|China|1412914089
US|United States|349035494
ID|Indonesia|287886782
PK|Pakistan|259299791
NG|Nigeria|242431832
BR|Brazil|213562666
BD|Bangladesh|177818044
RU|Russia|143394458
ET|Ethiopia|138902185
MX|Mexico|132997658
JP|Japan|122427731
EG|Egypt|120101175
PH|Philippines|117724471
CD|DR Congo|116452162
VN|Vietnam|102177431
IR|Iran|93168497
TR|Turkey|87926082
DE|Germany|83644258
TZ|Tanzania|72563780
TH|Thailand|71559614
GB|United Kingdom|69931528
FR|France|66746401
ZA|South Africa|65453084
IT|Italy|58926166
KE|Kenya|58636412
MM|Myanmar|55184819
CO|Colombia|53936226
SD|Sudan|53282719
UG|Uganda|52761469
KR|South Korea|51600388
DZ|Algeria|48028334
IQ|Iraq|48007437
ES|Spain|47850793
AR|Argentina|46003734
AF|Afghanistan|45047069
YE|Yemen|42961653
CA|Canada|40467728
AO|Angola|40215179
UA|Ukraine|39535849
MA|Morocco|38762441
PL|Poland|37843188
UZ|Uzbekistan|37724223
MZ|Mozambique|36639851
MY|Malaysia|36385115
GH|Ghana|35697557
SA|Saudi Arabia|35165787
PE|Peru|34922148
MG|Madagascar|33522052
CI|Côte d'Ivoire|33494346
CM|Cameroon|30640817
NP|Nepal|29629410
NE|Niger|28814878
VE|Venezuela|28633711
AU|Australia|27227096
KP|North Korea|26633691
SY|Syria|26472497
ML|Mali|25932275
BF|Burkina Faso|24601700
LK|Sri Lanka|23348315
TW|Taiwan|23011292
MW|Malawi|22785535
ZM|Zambia|22521915
TD|Chad|21560380
KZ|Kazakhstan|21083626
SO|Somalia|20305907
CL|Chile|19945850
SN|Senegal|19366548
GT|Guatemala|18967978
RO|Romania|18800605
NL|Netherlands|18448775
EC|Ecuador|18444506
KH|Cambodia|18051219
ZW|Zimbabwe|17273580
GN|Guinea|15441993
BJ|Benin|15170419
RW|Rwanda|14889693
BI|Burundi|14729157
BO|Bolivia|12749291
SS|South Sudan|12436037
TN|Tunisia|12415138
HT|Haiti|12037506
BE|Belgium|11774642
DO|Dominican Republic|11609500
JO|Jordan|11589532
AE|United Arab Emirates|11574682
HN|Honduras|11184760
TJ|Tajikistan|10978599
PG|Papua New Guinea|10947848
CU|Cuba|10892659
SE|Sweden|10701047
CZ|Czechia|10527781
AZ|Azerbaijan|10454855
PT|Portugal|10395362
TG|Togo|9930918
GR|Greece|9897115
IL|Israel|9647689
HU|Hungary|9585818
AT|Austria|9107266
CH|Switzerland|9007798
SL|Sierra Leone|8996745
BY|Belarus|8937018
LA|Laos|7974017
TM|Turkmenistan|7736632
LY|Libya|7539851
KG|Kyrgyzstan|7400465
HK|Hong Kong|7378602
NI|Nicaragua|7097329
PY|Paraguay|7095279
BG|Bulgaria|6667659
RS|Serbia|6641964
CG|Congo|6637785
SV|El Salvador|6391253
DK|Denmark|6023520
SG|Singapore|5905748
LB|Lebanon|5897467
LR|Liberia|5853949
CF|Central African Republic|5698984
PS|State of Palestine|5692790
OM|Oman|5671458
NO|Norway|5652989
FI|Finland|5621739
MR|Mauritania|5461319
SK|Slovakia|5451342
IE|Ireland|5356950
NZ|New Zealand|5287479
CR|Costa Rica|5174789
KW|Kuwait|5102773
PA|Panama|4625718
HR|Croatia|3822345
GE|Georgia|3804642
ER|Eritrea|3682669
MN|Mongolia|3556798
UY|Uruguay|3382537
PR|Puerto Rico|3222688
QA|Qatar|3173559
NA|Namibia|3153246
BA|Bosnia and Herzegovina|3114242
MD|Moldova|2961253
AM|Armenia|2930915
GM|Gambia|2884079
JM|Jamaica|2833403
LT|Lithuania|2797338
AL|Albania|2751025
GA|Gabon|2647399
BW|Botswana|2603388
LS|Lesotho|2389336
GW|Guinea-Bissau|2297808
SI|Slovenia|2114573
GQ|Equatorial Guinea|1984468
LV|Latvia|1835935
MK|North Macedonia|1804063
BH|Bahrain|1675572
TT|Trinidad and Tobago|1513268
TL|Timor-Leste|1436923
CY|Cyprus|1382334
EE|Estonia|1331062
SZ|Eswatini|1269859
MU|Mauritius|1265059
DJ|Djibouti|1199459
FJ|Fiji|937282
KM|Comoros|899010
RE|Réunion|886298
SB|Solomon Islands|858288
GY|Guyana|840890
BT|Bhutan|802214
MO|Macao|723188
LU|Luxembourg|687448
SR|Suriname|645256
ME|Montenegro|626233
EH|Western Sahara|610813
MT|Malta|549011
MV|Maldives|531517
CV|Cabo Verde|529630
BN|Brunei|469775
BZ|Belize|428644
BS|Bahamas|404628
IS|Iceland|402329
GP|Guadeloupe|372453
YT|Mayotte|347536
VU|Vanuatu|342564
MQ|Martinique|337711
GF|French Guiana|318872
NC|New Caledonia|297892
PF|French Polynesia|283076
BB|Barbados|282724
ST|São Tomé & Príncipe|244994
WS|Samoa|220528
CW|Curaçao|185440
LC|Saint Lucia|180488
GU|Guam|170185
KI|Kiribati|138445
SC|Seychelles|134959
GD|Grenada|117362
FM|Micronesia|114183
AW|Aruba|108164
TO|Tonga|103291
VC|St. Vincent & Grenadines|99245
AG|Antigua and Barbuda|94626
IM|Isle of Man|84055
AD|Andorra|83753
VI|U.S. Virgin Islands|83400
KY|Cayman Islands|77196
DM|Dominica|65511
BM|Bermuda|64459
FO|Faroe Islands|56526
GL|Greenland|55629
TC|Turks and Caicos|47148
KN|Saint Kitts & Nevis|46992
AS|American Samoa|45319
SX|Sint Maarten|44447
MP|Northern Mariana Islands|42914
GI|Gibraltar|40867
LI|Liechtenstein|40368
VG|British Virgin Islands|39936
MC|Monaco|38087
MH|Marshall Islands|35075
SM|San Marino|33605
BQ|Caribbean Netherlands|31913
MF|Saint Martin|23898
PW|Palau|17614
AI|Anguilla|14817
CK|Cook Islands|12826
NR|Nauru|12101
BL|Saint Barthélemy|11550
WF|Wallis & Futuna|11113
TV|Tuvalu|9362
PM|Saint Pierre & Miquelon|5513
SH|Saint Helena|5147
MS|Montserrat|4328
FK|Falkland Islands|3465
TK|Tokelau|2691
NU|Niue|1822
VA|Vatican City|506
`;

export interface CountryInfo {
  code: string;
  name: string;
  population: number;
}

export const COUNTRIES: CountryInfo[] = RAW.trim()
  .split('\n')
  .map((line) => {
    const [code, name, pop] = line.split('|');
    return { code, name, population: Number(pop) };
  });

const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));

export function getCountryInfo(code: string): CountryInfo | undefined {
  return BY_CODE.get(code);
}

export function flagUrl(code: string, width: 40 | 80 | 160 = 80): string {
  return `https://flagcdn.com/w${width}/${code.toLowerCase()}.png`;
}
