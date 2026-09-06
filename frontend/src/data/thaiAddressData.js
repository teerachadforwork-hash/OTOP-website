import THAI_ADDRESS_DATA from './thai_address_full.json';

export { THAI_ADDRESS_DATA };

export const getProvinces = () => THAI_ADDRESS_DATA.map(p => p.province);

export const getDistricts = (provinceName) => {
  const prov = THAI_ADDRESS_DATA.find(p => p.province === provinceName);
  return prov ? prov.districts.map(d => d.name) : [];
};

export const getSubdistricts = (provinceName, districtName) => {
  const prov = THAI_ADDRESS_DATA.find(p => p.province === provinceName);
  if (!prov) return [];
  const dist = prov.districts.find(d => d.name === districtName);
  return dist ? dist.subdistricts : [];
};
