import { useState, useMemo, useCallback, useRef, Fragment } from "react";

// ═══════════════════════════════════════════════════════
// AMINO ACID DATABASE
// ═══════════════════════════════════════════════════════
const AA = {
  A:{n:'Ala',mw:89.094, pKa:null, hydro:1.8,  hP:1.42,t:'H'},
  R:{n:'Arg',mw:174.202,pKa:12.48,hydro:-4.5, hP:0.98,t:'P'},
  N:{n:'Asn',mw:132.118,pKa:null, hydro:-3.5, hP:0.67,t:'U'},
  D:{n:'Asp',mw:133.103,pKa:3.65, hydro:-3.5, hP:1.01,t:'N'},
  C:{n:'Cys',mw:121.158,pKa:8.18, hydro:2.5,  hP:0.70,t:'U'},
  E:{n:'Glu',mw:147.130,pKa:4.25, hydro:-3.5, hP:1.51,t:'N'},
  Q:{n:'Gln',mw:146.146,pKa:null, hydro:-3.5, hP:1.11,t:'U'},
  G:{n:'Gly',mw:75.032, pKa:null, hydro:-0.4, hP:0.57,t:'S'},
  H:{n:'His',mw:155.156,pKa:6.00, hydro:-3.2, hP:1.00,t:'P'},
  I:{n:'Ile',mw:131.174,pKa:null, hydro:4.5,  hP:1.08,t:'H'},
  L:{n:'Leu',mw:131.174,pKa:null, hydro:3.8,  hP:1.21,t:'H'},
  K:{n:'Lys',mw:146.190,pKa:10.53,hydro:-3.9, hP:1.16,t:'P'},
  M:{n:'Met',mw:149.208,pKa:null, hydro:1.9,  hP:1.45,t:'H'},
  F:{n:'Phe',mw:165.191,pKa:null, hydro:2.8,  hP:1.13,t:'H'},
  P:{n:'Pro',mw:115.132,pKa:null, hydro:-1.6, hP:0.57,t:'S'},
  S:{n:'Ser',mw:105.093,pKa:null, hydro:-0.8, hP:0.77,t:'U'},
  T:{n:'Thr',mw:119.119,pKa:null, hydro:-0.7, hP:0.83,t:'U'},
  W:{n:'Trp',mw:204.228,pKa:null, hydro:-0.9, hP:1.08,t:'H'},
  Y:{n:'Tyr',mw:181.191,pKa:10.07,hydro:-1.3, hP:0.69,t:'U'},
  V:{n:'Val',mw:117.148,pKa:null, hydro:4.2,  hP:1.06,t:'H'},
};

// ═══════════════════════════════════════════════════════
// NON-NATURAL AMINO ACID DATABASE
// ═══════════════════════════════════════════════════════
const NNAA = {
  Aib:  {n:'α-Aminoisobutyric acid',lab:'Aib',  mw:103.120,pKa:null, hydro:1.0,  hP:1.70,t:'H',replaces:'A',
    note:'Helix stabilizer, DPP-4 resistant. Used in semaglutide pos2.',protR:true},
  Nle:  {n:'Norleucine',           lab:'Nle',  mw:131.174,pKa:null, hydro:3.8,  hP:1.21,t:'H',replaces:'M',
    note:'Met 대체 (산화 방지). 동일 MW, 유사 소수성.',protR:false},
  Hyp:  {n:'Hydroxyproline',       lab:'Hyp',  mw:131.130,pKa:null, hydro:-0.5, hP:0.57,t:'U',replaces:'P',
    note:'Pro 대체, collagen 안정화, 수용성↑.',protR:true},
  Nal:  {n:'β-Naphthylalanine',    lab:'Nal',  mw:215.248,pKa:null, hydro:4.0,  hP:1.13,t:'H',replaces:'F',
    note:'강한 소수성, π-stacking 강화, 결합력↑.',protR:true},
  Sar:  {n:'Sarcosine (N-MeGly)',  lab:'Sar',  mw:89.094, pKa:null, hydro:0.0,  hP:0.57,t:'S',replaces:'G',
    note:'N-methyl화 → protease 저항. GlyN 대체.',protR:true},
  Dab:  {n:'Diaminobutyric acid',  lab:'Dab',  mw:118.134,pKa:8.2,  hydro:-3.0, hP:1.00,t:'P',replaces:'K',
    note:'짧은 side chain Lys 유사체. AMP에 사용.',protR:false},
  Dap:  {n:'Diaminopropionic acid',lab:'Dap',  mw:104.108,pKa:6.7,  hydro:-3.5, hP:1.00,t:'P',replaces:'K',
    note:'가장 짧은 Lys 유사체. Branching 가능.',protR:false},
  Orn:  {n:'Ornithine',            lab:'Orn',  mw:132.161,pKa:10.8, hydro:-3.5, hP:1.10,t:'P',replaces:'K',
    note:'Lys보다 1탄소 짧은 유사체. 자연 비단백질 AA.',protR:false},
  Cit:  {n:'Citrulline',           lab:'Cit',  mw:175.188,pKa:null, hydro:-3.0, hP:0.67,t:'U',replaces:'R',
    note:'Arg → 중성 유사체. 양전하 제거, 수용성 유지.',protR:false},
  hSer: {n:'Homoserine',           lab:'hSer', mw:119.119,pKa:null, hydro:-1.0, hP:0.77,t:'U',replaces:'S',
    note:'Ser보다 1탄소 긴 유사체.',protR:false},
  Cha:  {n:'Cyclohexylalanine',    lab:'Cha',  mw:171.237,pKa:null, hydro:4.5,  hP:1.08,t:'H',replaces:'F',
    note:'Phe 포화 유사체. 더 강한 소수성, π-stacking 없음.',protR:true},
  tBuG: {n:'tert-Butylglycine',    lab:'tBuG', mw:131.174,pKa:null, hydro:3.5,  hP:1.42,t:'H',replaces:'V',
    note:'Val보다 큰 소수성 측쇄. Protease 저항.',protR:true},
  NMeA: {n:'N-Methyl-Alanine',     lab:'NMeA', mw:103.120,pKa:null, hydro:1.2,  hP:1.42,t:'H',replaces:'A',
    note:'N-methyl화 → 강한 protease 저항. Backbone 변형.',protR:true},
  NMeL: {n:'N-Methyl-Leucine',     lab:'NMeL', mw:145.200,pKa:null, hydro:4.0,  hP:1.21,t:'H',replaces:'L',
    note:'N-methyl화 Leu. Cyclosporin에 사용.',protR:true},
  Aad:  {n:'α-Aminoadipic acid',   lab:'Aad',  mw:161.157,pKa:4.0,  hydro:-3.0, hP:1.01,t:'N',replaces:'E',
    note:'Glu보다 1탄소 긴 산성 AA.',protR:false},
  Phg:  {n:'Phenylglycine',        lab:'Phg',  mw:151.163,pKa:null, hydro:2.5,  hP:0.70,t:'H',replaces:'F',
    note:'Phe보다 짧은 방향족 AA. 제약 응용.',protR:true},
};
// Helper: get effective AA properties at a position (NNAA overrides standard AA)
function getAAProps(seq, nnAA, idx){
  const nn = nnAA[idx];
  if(nn && NNAA[nn]) return NNAA[nn];
  const aa = seq[idx];
  return AA[aa] || AA.G;
}
const TYPE_RAMP  = {H:'amber',P:'blue',N:'coral',U:'teal',S:'gray'};
const TYPE_LABEL = {H:'Hydrophobic',P:'Positive',N:'Negative',U:'Polar',S:'Gly/Pro'};
const TYPE_HEX   = {
  H:{bg:'#FAEEDA',border:'#BA7517',text:'#633806'},
  P:{bg:'#E6F1FB',border:'#185FA5',text:'#042C53'},
  N:{bg:'#FAECE7',border:'#993C1D',text:'#4A1B0C'},
  U:{bg:'#E1F5EE',border:'#0F6E56',text:'#04342C'},
  S:{bg:'#F1EFE8',border:'#5F5E5A',text:'#2C2C2A'},
};
const WATER = 18.015;
const RT = 0.593; // kcal/mol at 298K

const LINKERS = [
  // ── PEG (polyethylene glycol) ────────────── cat:'linker'
  {id:'PEG1',       lab:'PEG₁',              mw:44.05,  cat:'linker'},
  {id:'PEG2',       lab:'PEG₂',              mw:88.11,  cat:'linker'},
  {id:'PEG3',       lab:'PEG₃',              mw:132.16, cat:'linker'},
  {id:'PEG4',       lab:'PEG₄',              mw:176.21, cat:'linker'},
  {id:'PEG6',       lab:'PEG₆',              mw:264.32, cat:'linker'},
  {id:'PEG8',       lab:'PEG₈',              mw:352.42, cat:'linker'},
  {id:'PEG12',      lab:'PEG₁₂',             mw:528.63, cat:'linker'},
  // ── AEEA / OEG ──────────────────────────── cat:'linker'
  {id:'AEEA1',      lab:'AEEA ×1',           mw:161.16, cat:'linker'},
  {id:'AEEA2',      lab:'AEEA ×2',           mw:322.32, cat:'linker'},
  {id:'AEEA3',      lab:'AEEA ×3',           mw:483.48, cat:'linker'},
  {id:'AEEA4',      lab:'AEEA ×4',           mw:644.64, cat:'linker'},
  {id:'OEG1',       lab:'OEG ×1',            mw:147.13, cat:'linker'},
  {id:'OEG2',       lab:'OEG ×2',            mw:294.26, cat:'linker'},
  {id:'OEG3',       lab:'OEG ×3',            mw:441.39, cat:'linker'},
  {id:'miniPEG',    lab:'Mini-PEG (mPEG)',   mw:103.12, cat:'linker'},
  {id:'miniPEG2',   lab:'Mini-PEG ×2',       mw:206.24, cat:'linker'},
  // ── γ-Glu combinations ──────────────────── cat:'linker'
  {id:'gGlu',       lab:'γ-Glu',             mw:129.12, cat:'spacer'},
  {id:'gGluAEEA',   lab:'γ-Glu-AEEA',        mw:290.28, cat:'linker'},
  {id:'gGlu2AEEA',  lab:'γ-Glu-2×AEEA',      mw:451.44, cat:'linker'},
  {id:'gGlu3AEEA',  lab:'γ-Glu-3×AEEA',      mw:612.60, cat:'linker'},
  {id:'gGlu2OEG',   lab:'γ-Glu-2×OEG',       mw:405.42, cat:'linker'},
  {id:'gGluOEG',    lab:'γ-Glu-OEG',         mw:258.28, cat:'linker'},
  // ── α-Glu (isoGlu) combinations ─────────── cat:'linker'
  {id:'isoGlu',     lab:'αGlu (isoGlu)',      mw:129.12, cat:'spacer'},
  {id:'isoGluAEEA', lab:'αGlu-AEEA',         mw:290.28, cat:'linker'},
  {id:'isoGlu2AEEA',lab:'αGlu-2×AEEA',       mw:451.44, cat:'linker'},
  // ── Other complex linkers ────────────────── cat:'linker'
  {id:'Ttds',       lab:'TTDS',              mw:264.32, cat:'linker'},
  {id:'Ida',        lab:'IDA (iminodiacetic)',mw:133.10, cat:'linker'},
  // ── Neutral spacers ──────────────────────── cat:'spacer'
  {id:'Gly',        lab:'Gly',               mw:75.03,  cat:'spacer'},
  {id:'GlyGly',     lab:'Gly-Gly',           mw:132.12, cat:'spacer'},
  {id:'GlyGlyGly',  lab:'Gly-Gly-Gly',       mw:189.17, cat:'spacer'},
  {id:'GABA',       lab:'GABA',              mw:103.12, cat:'spacer'},
  {id:'betaAla',    lab:'β-Ala',             mw:89.09,  cat:'spacer'},
  {id:'Sar',        lab:'Sarcosine (Sar)',    mw:89.09,  cat:'spacer'},
  {id:'Ahx',        lab:'Ahx (6-Acp)',       mw:131.17, cat:'spacer'},
  {id:'Ado',        lab:'Ado (8-Aoc)',       mw:159.23, cat:'spacer'},
  {id:'Aun',        lab:'Aun (11-Aund)',     mw:185.27, cat:'spacer'},
  {id:'Pip',        lab:'Pip (pipecolic)',   mw:129.16, cat:'spacer'},
  {id:'Pro',        lab:'Pro',               mw:115.13, cat:'spacer'},
  // ── Lys-based branching ──────────────────── cat:'spacer'
  {id:'Lys',        lab:'Lys (branch)',      mw:146.19, cat:'spacer'},
  {id:'dLys',       lab:'D-Lys',            mw:146.19, cat:'spacer'},
  {id:'Abu',        lab:'Abu (γ-Abu)',       mw:103.12, cat:'spacer'},
];
const FAS = [
  // ── 포화 단산 (Monoacid, saturated) ──────────────────────────
  {id:'C6',   lab:'C6  Caproic',    mw:116.16,C:6, d:false},  // hexanoic
  {id:'C8',   lab:'C8  Caprylic',   mw:144.21,C:8, d:false},  // octanoic
  {id:'C10',  lab:'C10 Capric',     mw:172.26,C:10,d:false},  // decanoic
  {id:'C12',  lab:'C12 Lauric',     mw:200.32,C:12,d:false},  // dodecanoic
  {id:'C14',  lab:'C14 Myristic',   mw:228.37,C:14,d:false},  // tetradecanoic (insulin detemir)
  {id:'C16',  lab:'C16 Palmitic',   mw:256.42,C:16,d:false},  // hexadecanoic (liraglutide)
  {id:'C18',  lab:'C18 Stearic',    mw:284.48,C:18,d:false},  // octadecanoic
  {id:'C20',  lab:'C20 Arachidic',  mw:312.53,C:20,d:false},  // eicosanoic
  {id:'C22',  lab:'C22 Behenic',    mw:340.58,C:22,d:false},  // docosanoic
  {id:'C24',  lab:'C24 Lignoceric', mw:368.64,C:24,d:false},  // tetracosanoic
  // ── 불포화 단산 (Monoacid, unsaturated) ─────────────────────
  {id:'C16u', lab:'C16:1 Palmitoleic', mw:254.41,C:16,d:false,u:true}, // C16:1 Δ9
  {id:'C18u', lab:'C18:1 Oleic',       mw:282.46,C:18,d:false,u:true}, // C18:1 Δ9
  {id:'C18u2',lab:'C18:2 Linoleic',    mw:280.45,C:18,d:false,u:true}, // C18:2 Δ9,12
  {id:'C20u', lab:'C20:1 Gondoic',     mw:310.51,C:20,d:false,u:true}, // C20:1
  {id:'C22u', lab:'C22:1 Erucic',      mw:338.57,C:22,d:false,u:true}, // C22:1 Δ13
  // ── 이산 (Diacid, bidentate albumin binding) ────────────────
  {id:'C8d',  lab:'C8  Diacid',     mw:174.19,C:8, d:true },  // suberic acid
  {id:'C10d', lab:'C10 Diacid',     mw:202.25,C:10,d:true },  // sebacic acid
  {id:'C12d', lab:'C12 Diacid',     mw:230.30,C:12,d:true },  // dodecanedioic acid ★
  {id:'C14d', lab:'C14 Diacid',     mw:258.36,C:14,d:true },  // tetradecanedioic acid
  {id:'C16d', lab:'C16 Diacid',     mw:286.41,C:16,d:true },  // hexadecanedioic acid
  {id:'C18d', lab:'C18 Diacid',     mw:314.46,C:18,d:true },  // octadecanedioic acid (semaglutide) ★★★
  {id:'C20d', lab:'C20 Diacid',     mw:342.52,C:20,d:true },  // eicosanedioic acid (tirzepatide) ★★★
  {id:'C22d', lab:'C22 Diacid',     mw:370.57,C:22,d:true },  // docosanedioic acid
  {id:'C24d', lab:'C24 Diacid',     mw:398.62,C:24,d:true },  // tetracosanedioic acid
];

function itemMW(item){
  if(item.type==='linker') return (LINKERS.find(l=>l.id===item.id)?.mw??0)-WATER;
  if(item.type==='fa')     return (FAS.find(f=>f.id===item.id)?.mw??0)-WATER;
  if(item.type==='cleavable') return CLEAVABLE_LINKERS.find(c=>c.id===item.id)?.mw??0;
  return 0;
}
function itemLabel(item){
  if(item.type==='linker') return LINKERS.find(l=>l.id===item.id)?.lab??item.id;
  if(item.type==='fa')     return FAS.find(f=>f.id===item.id)?.lab??item.id;
  if(item.type==='cleavable') return '✂ '+(CLEAVABLE_LINKERS.find(c=>c.id===item.id)?.lab??item.id);
  return item.id;
}
function chainMW(chain){ return (chain??[]).reduce((s,i)=>s+itemMW(i),0); }

// ═══════════════════════════════════════════════════════
// BBB SHUTTLE PEPTIDE (BPP) DATABASE
// ═══════════════════════════════════════════════════════
const BPPS = [
  { id:'none', lab:'None', seq:'', mw:0, receptor:'—', mechanism:'—', brainUptake:'—', clinical:'—', rating:0,
    notes:'No BPP attached' },
  { id:'ang2', lab:'Angiopep-2', seq:'TFFYGGSRGKRNNFKTEEY', mw:2394, receptor:'LRP-1',
    mechanism:'RMT', brainUptake:'Kin=7.1×10⁻⁴ mL/s/g', clinical:'Phase II (ANG1005)', rating:5,
    keyResidueWarning:'K10,K15 must remain free (LRP-1 binding)',
    adWarning:'LRP-1 ↓ in AD/aging patients',
    notes:'Most validated. C-term conjugation preserves K10/K15. Not P-gp substrate.' },
  { id:'tat', lab:'TAT(47-57)', seq:'YGRKKRRQRRR', mw:1560, receptor:'Non-specific (cationic)',
    mechanism:'AMT', brainUptake:'~3.8% ID/brain (liposome)', clinical:'Preclinical', rating:2,
    notes:'Most studied CPP but no brain selectivity. May be trapped in endothelium.' },
  { id:'rvg29', lab:'RVG-29', seq:'YTIWMPENPRPGTPCDIFTNSRGKRASNG', mw:3200, receptor:'nAChR / GABA_B',
    mechanism:'RMT', brainUptake:'~3.4% ID/brain (liposome)', clinical:'Preclinical', rating:4,
    notes:'Neuron-specific. D-AA OK (2025). Contains Cys15 — disulfide management needed.' },
  { id:'dnp2', lab:'dNP2', seq:'KIKKVKKKGRK', mw:1283, receptor:'Heparan sulfate',
    mechanism:'AMT (lipid raft)', brainUptake:'Parenchyma confirmed (2h IV)', clinical:'Preclinical', rating:3,
    notes:'Human-derived (NLBP). 4× better than TAT. No toxicity at 200µM.' },
  { id:'dnp2d', lab:'dNP2 (dimer)', seq:'KIKKVKKKGRKKIKKVKKKGRK', mw:2566, receptor:'Heparan sulfate',
    mechanism:'AMT (lipid raft)', brainUptake:'Superior to monomer', clinical:'Preclinical', rating:3,
    notes:'Dimer form for in vivo. Human-derived.' },
  { id:'peph3', lab:'PepH3', seq:'AGILKRW', mw:829, receptor:'Receptor-free',
    mechanism:'AMT', brainUptake:'0.31% ID/g (5min)', clinical:'Preclinical', rating:2,
    notes:'Shortest BPP (7aa). Dengue virus capsid-derived. Bidirectional transport.' },
  { id:'custom', lab:'Custom', seq:'', mw:0, receptor:'User-defined', mechanism:'User-defined',
    brainUptake:'—', clinical:'—', rating:0, notes:'Enter custom BPP sequence' },
];

const CLEAVABLE_LINKERS = [
  { id:'hydrazone', lab:'Hydrazone', mw:14, cleavagePH:'5.0-5.5', halfLife:'2-6h (pH 5.0)', serumStab:'>24h',
    mechanism:'pH-sensitive hydrolysis in endosome/lysosome',
    notes:'Best for endosomal FA release. Stable at pH 7.4.' },
  { id:'valcit', lab:'Val-Cit (Cathepsin B)', mw:214, cleavagePH:'5.0-5.5', halfLife:'1-4h', serumStab:'>48h',
    mechanism:'Cathepsin B protease in late endosome/lysosome',
    notes:'High serum stability. Used in ADCs.' },
  { id:'disulfide', lab:'Disulfide (S-S)', mw:0, cleavagePH:'pH-independent', halfLife:'<1h (10mM GSH)', serumStab:'>24h',
    mechanism:'Glutathione reduction in cytoplasm',
    notes:'Cleaves in cytoplasm, not endosome.' },
  { id:'ester', lab:'Ester (ANG1005-type)', mw:100, cleavagePH:'5-6', halfLife:'Variable', serumStab:'Moderate',
    mechanism:'Esterase + acidic hydrolysis',
    notes:'Used in ANG1005. Some serum esterase sensitivity.' },
  { id:'gflg', lab:'GFLG (Cathepsin B)', mw:392, cleavagePH:'5.0-5.5', halfLife:'1-4h', serumStab:'>48h',
    mechanism:'Cathepsin B tetrapeptide substrate',
    notes:'Classic lysosomal cleavage. Adds ~4 residues.' },
];

// ═══════════════════════════════════════════════════════
// STRUCTURE ANALYSIS (AlphaFold3 CIF parser)
// ═══════════════════════════════════════════════════════
function parseCIF(text){
  const atoms=[];
  for(const line of text.split('\n')){
    if(!line.startsWith('ATOM')) continue;
    const p=line.split(/\s+/);
    if(p.length<13) continue;
    try{
      atoms.push({chain:p[6],res3:p[5],resn:parseInt(p[8]),atom:p[3],
        x:parseFloat(p[10]),y:parseFloat(p[11]),z:parseFloat(p[12])});
    }catch(e){}
  }
  return atoms;
}
function analyzeStructure(atoms, pepSeq, tgtSeq){
  const caA=atoms.filter(a=>a.chain==='A'&&a.atom==='CA');
  const caB=atoms.filter(a=>a.chain==='B'&&a.atom==='CA');
  if(!caA.length||!caB.length) return null;
  const dist=(a,b)=>Math.sqrt((a.x-b.x)**2+(a.y-b.y)**2+(a.z-b.z)**2);
  // Per-residue distance to nearest target CA
  const pepDistToTarget=caA.map(a=>{
    let minD=999,nearestRes=-1,nearestAA='';
    for(const b of caB){
      const d=dist(a,b);
      if(d<minD){minD=d;nearestRes=b.resn;nearestAA=tgtSeq[b.resn-1]||'?';}
    }
    return{resn:a.resn, pepAA:pepSeq[a.resn-1]||'?', nearestRes, nearestAA, dist:Math.round(minD*10)/10};
  });
  // Interface residues (< 8Å CA-CA)
  const interfaceRes=pepDistToTarget.filter(r=>r.dist<8).map(r=>r.resn);
  // Hydrophobic target residues near each peptide position
  const hydro=new Set('AILMFWVPY');
  const hydroContacts=pepDistToTarget.filter(r=>r.dist<8&&hydro.has(r.nearestAA)).map(r=>({
    pepResn:r.resn, pepAA:r.pepAA, tgtResn:r.nearestRes, tgtAA:r.nearestAA, dist:r.dist
  }));
  return{pepDistToTarget, interfaceRes, hydroContacts, chainALen:caA.length, chainBLen:caB.length};
}

// ═══════════════════════════════════════════════════════
// BASIC CALCULATIONS
// ═══════════════════════════════════════════════════════
function calcMW(seq,cAmide,atts,nnAAMap){
  if(!seq.length) return 0;
  let mw=0;
  for(let i=0;i<seq.length;i++){
    const props = nnAAMap?.[i] ? NNAA[nnAAMap[i]] : AA[seq[i]];
    mw+=(props?.mw??0)-WATER;
  }
  mw+=WATER; if(cAmide) mw-=0.984;
  for(const chain of Object.values(atts)) mw+=chainMW(chain);
  return mw;
}
function qAtPH(seq,pH,cAmide,nnAAMap){
  let q=0;
  q+=1/(1+Math.pow(10,pH-8.0));
  if(!cAmide) q-=1/(1+Math.pow(10,3.1-pH));
  for(let i=0;i<seq.length;i++){
    const nn = nnAAMap?.[i];
    const aa = seq[i];
    const p = nn ? NNAA[nn] : AA[aa];
    if(!p||p.pKa===null) continue;
    // Acidic: D,E,C,Y or NNAA with low pKa
    if(p.pKa < 8 && ['D','E','C','Y'].includes(aa) && !nn) q-=1/(1+Math.pow(10,p.pKa-pH));
    else if(p.pKa < 8 && nn && (NNAA[nn].replaces&&'DECY'.includes(NNAA[nn].replaces))) q-=1/(1+Math.pow(10,p.pKa-pH));
    // Basic: K,R,H or NNAA with high pKa
    else if(['K','R','H'].includes(aa) && !nn) q+=1/(1+Math.pow(10,pH-p.pKa));
    else if(nn && p.pKa > 8) q+=1/(1+Math.pow(10,pH-p.pKa));
  }
  return q;
}
function calcPI(seq,cAmide,nnAAMap){
  if(!seq.length) return null;
  let lo=0,hi=14;
  for(let i=0;i<200;i++){
    const m=(lo+hi)/2,q=qAtPH(seq,m,cAmide,nnAAMap);
    if(Math.abs(q)<1e-5) return m;
    q>0?(lo=m):(hi=m);
  }
  return (lo+hi)/2;
}
// D-AA: side chain이 L-helix에서 반대 방향으로 돌출 → 해당 위치의 hydrophobicity 기여를 180° 반전
// N-term/C-term FA: 말단 고정 → 첫/마지막 잔기 소수성 기여에 반영
// Ref: Seebach & Gardiner 2008 Acc Chem Res; Kurtzhals 1995 Biochem J
// FA별 유효 소수성 boost (chain length 기반)
// Ref: Kurtzhals 1995 Biochem J; Knudsen 2000 J Med Chem
const FA_HYDRO_BOOST = {
  C8:1.0, C10:1.3, C12:1.8, C14:2.1, C16:2.5,
  C18:3.0, C18u:2.8, C18d:1.8,
  C20:3.2, C20d:2.4, C22:3.5, C22d:2.7,
};

function calcMuH(seq, dAA, atts){
  const d=100*Math.PI/180; let sx=0,sy=0,n=0;
  const ntermFAId = atts?.['nterm']?.find(c=>c?.type==='fa')?.id;
  const ctermFAId = atts?.['cterm']?.find(c=>c?.type==='fa')?.id;
  for(let i=0;i<seq.length;i++){
    let h=AA[seq[i]]?.hydro??0;
    // Side chain FA
    const chain = atts?.[`r${i}`] || [];
    const faItem = chain.find(c=>c?.type==='fa');
    if(faItem){
      const raw = FA_HYDRO_BOOST[faItem.id]??1.5;
      const eff = faItem.id==='C18d' ? raw-0.8 : raw;
      h = h < 0 ? h + eff : h + eff * 0.3;
    }
    // N-term FA: boosts effective hydrophobicity at position 0
    if(i===0 && ntermFAId){
      const raw = FA_HYDRO_BOOST[ntermFAId]??1.5;
      const eff = ntermFAId==='C18d' ? raw-0.8 : raw;
      h = h < 0 ? h + eff*0.6 : h + eff*0.2; // partial effect (anchor at terminus)
    }
    // C-term FA: boosts last residue
    if(i===seq.length-1 && ctermFAId){
      const raw = FA_HYDRO_BOOST[ctermFAId]??1.5;
      const eff = ctermFAId==='C18d' ? raw-0.8 : raw;
      h = h < 0 ? h + eff*0.6 : h + eff*0.2;
    }
    const angle = dAA?.[i] ? (i*d + Math.PI) : (i*d);
    sx+=h*Math.cos(angle); sy+=h*Math.sin(angle); n++;
  }
  return n>0?Math.sqrt(sx*sx+sy*sy)/n:0;
}
function calcHelixP(seq){
  return [...seq].map((_,i)=>{
    const s=Math.max(0,i-2),e=Math.min(seq.length-1,i+2);
    let sum=0,cnt=0;
    for(let j=s;j<=e;j++){sum+=AA[seq[j]]?.hP??1;cnt++;}
    return cnt>0?sum/cnt:1;
  });
}

// Chou-Fasman beta-strand propensity (βP)
// Ref: Chou & Fasman 1978 Adv Enzymol 47:45
const BETA_P = {
  A:0.83,R:0.93,N:0.89,D:0.54,C:1.19,E:0.37,Q:1.10,G:0.75,
  H:0.87,I:1.60,L:1.30,K:0.74,M:1.05,F:1.38,P:0.55,S:0.75,
  T:1.19,W:1.37,Y:1.47,V:1.70,
};
function calcBetaP(seq){
  return [...seq].map((_,i)=>{
    const s=Math.max(0,i-2),e=Math.min(seq.length-1,i+2);
    let sum=0,cnt=0;
    for(let j=s;j<=e;j++){sum+=(BETA_P[seq[j]]??0.75);cnt++;}
    return cnt>0?sum/cnt:0.75;
  });
}

// Simple secondary structure assignment
// H = helix (hP > 1.0 AND hP > bP), E = beta (bP > 1.0 AND bP > hP), C = coil
// Pro = always coil-breaking
function predictSS(seq, helixPs, betaPs){
  return [...seq].map((aa,i)=>{
    const h=helixPs[i]??1, b=betaPs[i]??0.75;
    const inFB = false;
    if(aa==='P') return 'C'; // Pro = helix breaker    if(h>1.0 && h>b+0.05) return 'H';
    if(b>1.0 && b>h+0.05) return 'E';
    if(h>1.0) return 'H';
    if(b>1.0) return 'E';
    return 'C';
  });
}
function seqGravy(seq,nnAAMap){
  if(!seq.length) return null;
  const h=[...seq].map((a,i)=>{
    const nn=nnAAMap?.[i]; return nn ? (NNAA[nn]?.hydro??0) : (AA[a]?.hydro??0);
  });
  return h.reduce((a,b)=>a+b,0)/h.length;
}

// ─── ChatGPT 방식 Helix modification (적응 통합) ───────────────────────────
// Helix propensity를 FA/linker가 직접 수치로 바꾸는 방식.
// avgHP 자체를 수정해서 scoreBinding 전체에 전파됨.
// Ref: Seebach 2008; Murase 2020 JACS; Shepherd 2005 J Pept Sci
function linkerHelixEffect(chain){
  let delta=0;
  for(const item of (chain||[])){
    if(item?.type!=='linker') continue;
    // PEG: flexible → helix 약화
    if(['PEG2','PEG4'].includes(item.id))       delta-=0.015;
    else if(item.id==='PEG8')                   delta-=0.04;
    else if(item.id==='PEG12')                  delta-=0.07;
    // AEEA: semi-rigid, mild helix support
    else if(['AEEA1','AEEA2'].includes(item.id)) delta+=0.01;
    else if(item.id==='AEEA3')                  delta+=0.015;
    // OEG: flexible PEG-like
    else if(item.id==='OEG1')                   delta-=0.01;
    else if(item.id==='OEG2')                   delta-=0.02;
    // γGlu: charge + spacer, mild stabilization
    else if(item.id==='gGlu')                   delta+=0.01;
    else if(item.id==='gGluAEEA')               delta+=0.015;
    else if(item.id==='gGlu2AEEA')              delta+=0.025;
  }
  return delta;
}

function faHelixEffect(atts, seq){
  if(!seq.length) return { delta:0, notes:[], perPos:{} };
  let total=0;
  const notes=[];
  const perPos={};
  for(const [posKey,chain] of Object.entries(atts||{})){
    if(!chain?.length) continue;
    const fas=chain.filter(i=>i?.type==='fa').map(i=>FAS.find(f=>f.id===i.id)).filter(Boolean);
    if(!fas.length) continue;
    const linkerCount=chain.filter(i=>i?.type==='linker').length;
    const linkerDelta=linkerHelixEffect(chain);
    let local=linkerDelta;
    let label=posKey;

    if(posKey==='nterm'){
      label='N-term';
      for(const fa of fas){
        // N-cap effect: FA at N-term stabilizes via hydrophobic capping + helix dipole interaction
        if(fa.C<=10)       local+=0.02;
        else if(fa.C<=14)  local+=0.04;
        else if(fa.C<=18)  local+=0.05;
        else               local+=0.04;
        if(fa.d) local-=0.01; // diacid charged end reduces capping
      }
      if(linkerCount===0) local-=0.04;       // no spacer → FA too close, steric clash
      else if(linkerCount>=2) local+=0.02;   // good spacer

    } else if(posKey==='cterm'){
      label='C-term';
      for(const fa of fas){
        if(fa.C<=10)       local+=0.01;
        else if(fa.C<=14)  local+=0.03;
        else if(fa.C<=18)  local+=0.04;
        else               local+=0.03;
        if(fa.d) local-=0.01;
      }
      if(linkerCount===0) local-=0.02;
      else if(linkerCount>=2) local+=0.01;

    } else {
      // Side chain
      const m=posKey.match(/^r(\d+)$/);
      const idx=m?parseInt(m[1],10):-1;
      const aa=idx>=0?seq[idx]:'?';
      label=idx>=0?`${aa}${idx+1}`:posKey;
      const rel=idx>=0?idx/Math.max(1,seq.length-1):0.5;
      const center=1-Math.abs(rel-0.5)*2; // 0=terminus, 1=center

      for(const fa of fas){
        if(aa==='K')      local+=0.01;  // Lys: ideal FA attachment
        else              local-=0.05;  // non-Lys: backbone disruption risk
        if(fa.C<=14)      local+=0.01;
        else if(fa.C<=18) local+=0.02;
        else              local+=0.01;
        if(fa.d) local-=0.01;
      }
      // Central residues: FA disrupts backbone H-bonds more
      local-=0.10*center;
      if(linkerCount===0) local-=0.05;
      else if(linkerCount>=2) local+=0.02;

      // Pro/Gly nearby: already helix-breaking, FA adds to disruption
      const neighbors=[seq[idx-1],seq[idx+1]].filter(Boolean);
      if(neighbors.includes('P')) local-=0.04;
      if(neighbors.includes('G')) local-=0.02;
    }

    if(fas.length>=2) local-=0.03*(fas.length-1);
    local=Math.max(-0.18,Math.min(0.12,local));
    total+=local;
    notes.push(`${label} ${fas.map(f=>f.lab).join('+')}(${local>=0?'+':''}${local.toFixed(2)})`);
    perPos[posKey] = local; // store per-position effect
  }
  total=Math.max(-0.35,Math.min(0.20,total));
  return{ delta:total, notes, perPos };
}

function calcModifiedHelix(seq, atts){
  const baseArr=calcHelixP(seq);
  const baseAvg=baseArr.length?baseArr.reduce((a,b)=>a+b,0)/baseArr.length:0;
  const mod=faHelixEffect(atts,seq);
  return{
    baseAvg,
    modifiedAvg: Math.max(0.20, Math.min(2.2, baseAvg+mod.delta)),
    delta: mod.delta,
    notes: mod.notes,
    perPos: mod.perPos,
  };
}

// ═══════════════════════════════════════════════════════════════════
// BINDING-MODE AWARE FA → IC50 EFFECT
// ═══════════════════════════════════════════════════════════════════
// α-helix 결합 (Ward 2013 calibration):
//   • FA at N-term → helix nucleation → helical content ↑ → IC50 ↓
//   • Δhelicity → fold improvement: log10(fold) = 2.5 × Δhelicity
//     (Ward 2013: ~10-25% helicity increase → 2-5× potency at best site)
//   • Ward 2013 position-dependent: K10,K25,K26 best → equivalent to
//     "mid-peptide (non-interface)" positions
//   • Steric clash (interface positions) overrides: -benefit, +penalty
//
//   • FA at core (1-14) → steric (already handled in faStericFactor)
//   • FA at JM/C-term → NO helicity benefit (β-strand, not helix)
//   • Small pre-org for β-strand: FA can pack against hydrophobic face
//     but this is very small (≤1.3×) and only at N-flank
//
// Extended/unknown:
//   • Conservative: no binding-mode-specific benefit
//   • Only steric/albumin effects apply
// ═══════════════════════════════════════════════════════════════════
function calcBindingModeFAEffect(atts, seq, bindingMode) {
  if (!bindingMode || !Object.values(atts||{}).some(ch=>ch?.some(i=>i?.type==='fa'))) {
    return { factor: 1.0, notes: [], mode: 'none' };
  }

  const mode = bindingMode.mode;
  const notes = [];
  let totalFactor = 1.0;

  // ── α-helix binding: Ward 2013 mechanism ─────────────────────────
  if (mode === 'helix') {
    const helixMod = faHelixEffect(atts, seq);
    const deltaHelicity = helixMod.delta; // change in helix propensity avg

    // Only positions OUTSIDE binding interface benefit
    // We estimate: N-term FA → 80% of delta applies; mid/C-term → 50%
    // (conservative: without structural data we don't know interface)
    let effectiveDelta = deltaHelicity;
    const hasNterm = Object.entries(atts).some(([k,ch])=>k==='nterm'&&ch?.some(i=>i?.type==='fa'));
    const hasCterm = Object.entries(atts).some(([k,ch])=>k==='cterm'&&ch?.some(i=>i?.type==='fa'));
    if (hasNterm) effectiveDelta *= 0.8;   // N-term: best position for helix nucleation
    else if (hasCterm) effectiveDelta *= 0.4; // C-term: less effective
    else effectiveDelta *= 0.6;            // side chain: moderate

    // Ward 2013 calibration: log10(fold_improvement) ≈ 2.5 × Δhelicity
    // Positive delta → IC50 improves (factor < 1)
    // Negative delta → IC50 worsens (factor > 1)
    const fold = Math.pow(10, -2.5 * effectiveDelta); // <1 = improvement
    const foldClamped = Math.max(0.2, Math.min(5.0, fold));

    totalFactor *= foldClamped;

    if (Math.abs(effectiveDelta) > 0.02) {
      notes.push(
        `α-helix mode (Ward 2013): Δhelicity=${effectiveDelta>=0?'+':''}${(effectiveDelta*100).toFixed(1)}%`+
        ` → IC50 ${foldClamped<1?`×${foldClamped.toFixed(2)} 개선`:`×${foldClamped.toFixed(2)} 악화`}`
      );
    }
    notes.push(`근거: Ward 2013 Mol.Metab. · 신뢰도 ★★☆ · 타겟 구조 없이는 ±3× 불확도`);

  // ── β-strand binding: position-dependent small benefit ────────────
  } else if (mode === 'beta_strand') {
    // For β-strand, helical content change is IRRELEVANT to binding
    // Only FA at N-flank (within 2 residues of core N-terminus) has
    // small pre-org benefit through intramolecular hydrophobic contact
    // with the hydrophobic face (Y, F, V residues)
    const fbStart = bindingMode.faDangerPositions?.length > 0
      ? Math.min(...(bindingMode.faDangerPositions||[0]))
      : null;

    for (const [posKey, chain] of Object.entries(atts||{})) {
      if (!chain?.some(i=>i?.type==='fa')) continue;
      const faItem = chain.find(i=>i?.type==='fa');
      const fa = FAS.find(f=>f.id===faItem?.id);
      const C = fa?.C || 0;

      if (posKey === 'nterm' && fbStart !== null && fbStart <= 2) {
        // N-term FA, very close to β-strand core
        // Can pack against Y2/Y4/F5 hydrophobic face
        const preOrgBenefit = C >= 16 ? 0.80 : C >= 12 ? 0.88 : 0.95;
        totalFactor *= preOrgBenefit;
        notes.push(
          `β-strand N-flank pre-org: C${C} FA가 hydrophobic face(Y/F/V)에 intramolecular 접촉`+
          ` → IC50 ×${preOrgBenefit.toFixed(2)} (약한 pre-org 효과)`+
          ` · 신뢰도 ★☆☆ (추정)`
        );
      } else {
        // All other positions: no binding improvement from helix/pre-org
        notes.push(
          `β-strand mode: ${posKey} FA는 helix stabilization 효과 없음 (β-strand 결합이므로)`+
          ` — PK/albumin 역할만`
        );
      }
    }
    if (notes.filter(n=>!n.includes('PK/albumin')).length === 0) {
      notes.push(`β-strand 결합: FA IC50 직접 개선 없음 — helix pre-org 효과 미적용`);
    }

  } else {
    // Extended/unknown: conservative, no mode-specific benefit
    notes.push(`결합 모드 불분명(${mode}): binding-mode FA 보정 미적용`);
  }

  return {
    factor: Math.max(0.1, Math.min(10, totalFactor)),
    notes,
    mode,
    deltaHelicity: mode==='helix' ? faHelixEffect(atts, seq).delta : null,
  };
}
// ─── Position-dependent HSA affinity correction ───
// FA accessibility depends on: attachment residue type (Lys vs non-Lys),
// neighboring charged residues, and distance from terminus.
// Ref: Lau et al 2009 J Med Chem 52:1264; Madsen et al 2007 J Med Chem 50:6126;
//      Kurtzhals et al 1995 Biochem J 312:725 (fatty acid site occupancy on albumin)
function posCorrection(posKey, seq) {
  if (!seq.length) return { delta: 0, reason: 'No sequence' };
  if (posKey === 'nterm') return { delta: -0.05, reason: 'N-terminus: exposed amine, good accessibility' };
  if (posKey === 'cterm') return { delta: -0.05, reason: 'C-terminus: exposed, good accessibility' };

  const m = posKey.match(/^r(\d+)$/);
  if (!m) return { delta: 0, reason: '' };
  const idx = parseInt(m[1]);
  const aa = seq[idx];
  let delta = 0;
  const notes = [];

  // Non-Lys internal: ε-amine absent → alternative chemistry needed, reduces affinity
  if (aa !== 'K') {
    delta += 0.45;
    notes.push(`non-Lys (${aa}${idx+1}): non-standard attachment, +0.45 penalty`);
  }

  // Neighboring charged residues within ±3 positions
  // Cationic neighbors (K, R): electrostatically clash with HSA binding groove (Sudlow Site I/II)
  // Anionic neighbors (D, E): slightly complementary to HSA Arg/Lys residues near FA binding pocket
  let posNeighborEffect = 0, negNeighborEffect = 0;
  for (let j = Math.max(0, idx-3); j <= Math.min(seq.length-1, idx+3); j++) {
    if (j === idx) continue;
    const dist = Math.abs(j - idx);
    const w = 1.0 - (dist - 1) * 0.25; // dist1→1.0, dist2→0.75, dist3→0.5
    const nb = seq[j];
    if (['K','R'].includes(nb)) posNeighborEffect += 0.20 * w;
    if (['D','E'].includes(nb)) negNeighborEffect += 0.08 * w;
  }
  if (posNeighborEffect > 0.04) {
    delta += posNeighborEffect;
    notes.push(`cationic neighbors: +${posNeighborEffect.toFixed(2)} (electrostatic clash with HSA groove)`);
  }
  if (negNeighborEffect > 0.04) {
    delta -= negNeighborEffect;
    notes.push(`anionic neighbors: −${negNeighborEffect.toFixed(2)} (complementary to HSA Arg/Lys)`);
  }

  // Lys near terminus: better solvent exposure of side chain
  if (aa === 'K' && Math.min(idx, seq.length-1-idx) <= 2) {
    delta -= 0.12;
    notes.push(`near-terminal Lys: −0.12 (improved FA solvent exposure)`);
  }

  // Bulky aromatic neighbors: steric hindrance of FA projection
  const aromatics = [...seq.slice(Math.max(0,idx-2), idx), ...seq.slice(idx+1, Math.min(seq.length,idx+3))];
  const nAro = aromatics.filter(a=>'WFY'.includes(a)).length;
  if (nAro > 0) { delta += 0.10 * nAro; notes.push(`bulky aromatics nearby: +${(0.10*nAro).toFixed(2)} (steric hindrance)`); }

  const finalDelta = Math.max(-0.50, Math.min(0.80, delta));
  return {
    delta: finalDelta,
    reason: notes.length > 0 ? notes.join(' · ') : (aa==='K'?'Ideal Lys position, no penalty':''),
  };
}

// ─── Albumin Kd model — position-aware ───
// Returns { best: Kd_nM, positions: [{...detail per FA}] } or null
// Ref: Knudsen 2000; Madsen 2007; Sleep 2013; Lau 2009
function kdAlbumin(atts, seq=''){
  const results=[];
  for(const [posKey,chain] of Object.entries(atts)){
    if(!chain?.length) continue;
    const fas    =chain.filter(i=>i.type==='fa').map(i=>FAS.find(f=>f.id===i.id)).filter(Boolean);
    const linkers=chain.filter(i=>i.type==='linker').map(i=>LINKERS.find(l=>l.id===i.id)).filter(Boolean);
    for(const F of fas){
      if(!F.C) continue;
      // ① Base: log10(Kd/µM) from FA chain length (empirical log-linear)
      let logKd=5-F.C*0.35;
      if(F.d) logKd-=0.85;  // diacid bidentate: ~7× tighter
      if(F.id==='C18u') logKd+=0.10; // unsaturated: slightly weaker
      const logKd_fa=logKd;

      // ② Linker geometry bonus
      // Monoacid FA: linker 종류 별 차이 거의 없음 (Madsen 2007: GABA ≈ β-Ala ≈ γGlu ≈ liraglutide)
      //   단, 매우 긴 PEG(8+)은 FA를 약간 가림 → 소폭 악화
      // Diacid FA: bidentate albumin binding에 linker 길이/친수성이 critical
      //   γGlu-2×OEG(semaglutide) 구조가 최적 → 기준
      //   짧은 linker → distal acid가 albumin Site II 접근 어려움 → KD 악화
      // Ref: Lau et al. J Med Chem 2015 (γGlu-2×OEG = semaglutide, optimal)
      //      Madsen et al. J Med Chem 2007 (monoacid: GABA≈β-Ala≈γGlu in t1/2)
      let linkerBonus=0;
      const isDiacid = F.d;
      for(const L of linkers){
        if(isDiacid){
          // Diacid: linker가 FA의 두 번째 카복실기를 albumin Site II에 제시해야 함
          // 최적: OEG×2 또는 AEEA×2 조합 → bonus 크게
          if(['gGlu2AEEA','gGlu3AEEA','gGlu2OEG'].includes(L.id)) linkerBonus+=0.40; // semaglutide-like ★★★
          else if(['gGluAEEA','gGluOEG','isoGlu2AEEA'].includes(L.id)) linkerBonus+=0.28;
          else if(['AEEA2','OEG2','miniPEG2'].includes(L.id)) linkerBonus+=0.30;
          else if(['AEEA3','AEEA4','OEG3'].includes(L.id)) linkerBonus+=0.35;
          else if(['AEEA1','OEG1','isoGluAEEA'].includes(L.id)) linkerBonus+=0.18;
          else if(['PEG4','PEG3'].includes(L.id)) linkerBonus+=0.25;
          else if(['PEG6','PEG8'].includes(L.id)) linkerBonus+=0.20;
          else if(L.id==='PEG12') linkerBonus+=0.10;
          else if(L.id==='PEG2') linkerBonus+=0.18;
          else if(L.id==='PEG1') linkerBonus+=0.08;
          else if(['gGlu','isoGlu'].includes(L.id)) linkerBonus+=0.12;
          else if(L.id==='Ttds') linkerBonus+=0.32;
          else if(['Ado','Aun'].includes(L.id)) linkerBonus+=0.08;
          else if(['Ahx'].includes(L.id)) linkerBonus+=0.05;
          else if(['GABA','betaAla','Gly','GlyGly','GlyGlyGly'].includes(L.id)) linkerBonus+=0.03;
          else if(['Sar','Abu','Pro','Pip'].includes(L.id)) linkerBonus+=0.04;
          else if(['Lys','dLys'].includes(L.id)) linkerBonus+=0.06;
        } else {
          // Monoacid: 모든 short linker 효과 거의 동일 (Madsen 2007)
          if(['gGlu','GABA','betaAla','isoGlu','Gly','GlyGly','Sar','Abu'].includes(L.id)) linkerBonus+=0.05;
          else if(['AEEA1','OEG1','PEG2','Ahx','miniPEG'].includes(L.id)) linkerBonus+=0.05;
          else if(['AEEA2','OEG2','PEG4','PEG3','AEEA3','OEG3','Ado'].includes(L.id)) linkerBonus+=0.08;
          else if(['gGluAEEA','gGlu2AEEA','gGlu2OEG','isoGluAEEA'].includes(L.id)) linkerBonus+=0.10;
          else if(['PEG6','PEG8'].includes(L.id)) linkerBonus-=0.05;
          else if(L.id==='PEG12') linkerBonus-=0.12;
          else if(L.id==='Ttds') linkerBonus+=0.05;
        }
      }
      linkerBonus=Math.max(-0.15, Math.min(linkerBonus, isDiacid?0.50:0.15));
      logKd-=linkerBonus;
      const logKd_linker=logKd;

      // ③ Position correction (new)
      const posCor=posCorrection(posKey,seq);
      logKd+=posCor.delta;

      const kd_nM=Math.pow(10,Math.max(-3,logKd))*1000;
      results.push({
        posKey, faLabel:F.lab, linkerLabel:linkers.map(l=>l.lab).join('+') || 'none',
        logKd_fa, linkerBonus, logKd_linker,
        posDelta:posCor.delta, posReason:posCor.reason,
        logKd_final:logKd, kd_nM,
      });
    }
  }
  if(results.length===0) return null;
  const best=results.reduce((a,b)=>a.kd_nM<b.kd_nM?a:b);
  return{best:best.kd_nM, positions:results};
}
function kdMembrane(seq,q74){
  const mu=calcMuH(seq),posQ=Math.max(0,q74);
  return Math.pow(10,Math.max(-3,Math.min(4,3-4*mu-0.5*posQ)))*1000;
}
function fmtKd(nM){
  if(nM===null||nM===undefined) return '—';
  if(nM<0.001) return `${(nM*1e6).toFixed(0)} fM`;
  if(nM<1)     return `${(nM*1000).toFixed(0)} pM`;
  if(nM<1000)  return `${nM.toFixed(1)} nM`;
  if(nM<1e6)   return `${(nM/1000).toFixed(2)} µM`;
  return `${(nM/1e6).toFixed(2)} mM`;
}

// ═══════════════════════════════════════════════════════════════════
// WHY PURE PHYSICS FAILS HERE
// ─────────────────────────────────────────────────────────────────
// For tight binders (pM–nM), the favorable contacts at the actual
// interface provide ~15-25 kcal/mol of enthalpy. Bulk sequence
// properties (Debye-Hückel, SASA-average) only see ~7-10 kcal/mol.
// The entropy penalty (+5.5 TR + ~3.5 conf = +9 kcal/mol) then
// dominates, producing absurd mM estimates.
//
// CORRECT APPROACH: Two separate outputs:
//
// (A) EMPIRICAL Kd ESTIMATE — calibrated from known PPI data
//     Uses charge complementarity → affinity correlation derived from
//     experimentally measured PPI binding affinities. Much more useful.
//     Refs calibration data points:
//     · Barnase-Barstar |Z₁Z₂|≈56 → Kd≈10 fM  (Schreiber & Fersht 1993)
//     · FAM19A1-GPR1    |Z₁Z₂|≈35 → Kd≈14 pM  (Jeong et al. 2021)
//     · EphB2-ephrin    |Z₁Z₂|≈10 → Kd≈1 µM   (Himanen et al. 2001)
//     · Weak binder     |Z₁Z₂|≈0  → Kd≈10 µM  (baseline)
//     Linear regression: log₁₀(Kd/nM) = -0.155 × |Z₁Z₂| + 4.0
//     Uncertainty: ±2 log units (100×) — Kd is not charge alone
//
// (B) PHYSICS BREAKDOWN — for qualitative understanding of each term
//     Shows which components favor/disfavor binding, but the sum
//     gives a physically wrong Kd without structure. Labeled clearly.
// ═══════════════════════════════════════════════════════════════════

const RESIDUE_SASA = {
  A:113,R:241,N:158,D:151,C:140,E:183,Q:189,G:85, H:194,I:182,
  L:180,K:211,M:204,F:218,P:143,S:122,T:146,W:259,Y:229,V:160
};

// ─── (A) Empirical calibrated estimate ───
function empiricalKd(pepSeq, tgtSeq, pepQ74, tgtQ74, muH) {
  const HPHO = new Set('AILVMFW');
  const qP   = pepQ74 * tgtQ74;
  const absQP = Math.abs(qP);
  const fNP_pep = [...pepSeq].filter(a=>HPHO.has(a)).length/pepSeq.length;
  const fNP_tgt = [...tgtSeq].filter(a=>HPHO.has(a)).length/tgtSeq.length;

  // Base: charge complementarity → affinity
  // Calibrated from known PPI Kd values (see references above)
  // Favorable (complementary): log10(Kd/nM) = -0.155 × absQP + 4.0
  // Repulsive (same sign):     each unit of product adds +0.3 log units
  let logKd;
  if (qP < 0) {
    logKd = -0.155 * absQP + 4.0;
  } else {
    logKd = 0.30 * absQP + 4.0; // repulsive → much weaker
  }

  // Hydrophobic burial correction (matched nonpolar fractions improve affinity)
  const hydroMatch = Math.sqrt(fNP_pep * fNP_tgt);
  logKd -= hydroMatch * 2.0; // max ~-1 log unit if both heavily hydrophobic

  // Amphipathicity (amphipathic helix makes better groove engagement)
  logKd -= muH * 1.5;

  // Size ratio: ideal 0.1-0.5 (peptide/protein), penalize very unequal sizes
  const sizeRatio = Math.min(pepSeq.length, tgtSeq.length) / Math.max(pepSeq.length, tgtSeq.length);
  if (sizeRatio < 0.05 || sizeRatio > 0.95) logKd += 1.5;

  // Cys count of target: pre-organized scaffold → entropic advantage
  const nCysTgt = [...tgtSeq].filter(a=>a==='C').length;
  if (nCysTgt >= 8) logKd -= 1.0;       // very rigid scaffold (e.g. FAM19A proteins)
  else if (nCysTgt >= 4) logKd -= 0.5;

  const clamped = Math.max(-5, Math.min(7, logKd)); // fM to mM range
  return {
    Kd_nM:      Math.pow(10, clamped),
    Kd_low_nM:  Math.pow(10, clamped - 2), // ÷100 optimistic
    Kd_high_nM: Math.pow(10, clamped + 2), // ×100 pessimistic
    logKd_nM:   clamped,
    qP,
    absQP,
    dominant: qP < -20 ? 'Charge complementarity (dominant)' :
              muH > 0.4 ? 'Amphipathic helix (dominant)' :
              hydroMatch > 0.15 ? 'Hydrophobic burial' : 'Mixed / weak',
    nCysTgt, fNP_pep, fNP_tgt, sizeRatio,
  };
}


// [Removed: FB core scoring, alanine scanning, POS1213 table]

// albumin Kd by FA chain length (Sleep 2013, Knudsen 2000) — in µM
// Albumin binding Kd by FA (in µM)
// Ref: Kurtzhals 1995 Biochem J 312:725; Knudsen 2000 J Med Chem 43:1664
// Sleep 2013 BioDrugs 27:123; semaglutide: Kd ~10-50 nM (C18d + gGlu2AEEA)
const FA_ALBUMIN_KD_uM = {
  // Monoacid — Kurtzhals 1995, Lau 2009, Madsen 2007
  // logKd(µM) ≈ 5 - 0.35×C (empirical log-linear)
  C6:  800.0,  // ~800 µM (caproic, very weak)
  C8:  200.0,  // 200 µM (caprylic)
  C10: 50.0,   // 50 µM
  C12: 8.0,    // 8 µM (lauric)
  C14: 1.5,    // 1.5 µM (myristic, insulin detemir-like)
  C16: 0.3,    // 300 nM (palmitic, liraglutide-like)
  C18: 0.1,    // 100 nM (stearic)
  C20: 0.02,   // 20 nM
  C22: 0.008,  // 8 nM
  C24: 0.003,  // 3 nM
  // Unsaturated monoacid — slightly weaker due to kink (Lau 2009)
  C16u:0.40,   // C16:1 Palmitoleic, ~25% weaker than C16
  C18u:0.15,   // C18:1 Oleic (~150 nM)
  C18u2:0.25,  // C18:2 Linoleic, double kink → weaker
  C20u:0.03,   // C20:1
  C22u:0.012,  // C22:1 Erucic
  // Diacid — bidentate binding (Sudlow Sites I+II) → ~7× tighter than monoacid
  // logKd_diacid = logKd_mono - 0.85
  // Values here = optimal linker (γGlu-2×OEG/AEEA) reference
  C8d:  25.0,  // suberic (~25 µM with optimal linker)
  C10d: 5.0,   // sebacic (~5 µM)
  C12d: 1.0,   // dodecanedioic ★ (~1 µM)
  C14d: 0.20,  // tetradecanedioic (~200 nM)
  C16d: 0.04,  // hexadecanedioic (~40 nM)
  C18d: 0.05,  // octadecanedioic (semaglutide, ~50 nM) ★★★
  C20d: 0.015, // eicosanedioic (tirzepatide, ~15 nM) ★★★
  C22d: 0.006, // docosanedioic (~6 nM)
  C24d: 0.002, // tetracosanedioic (~2 nM)
};

// ═══════════════════════════════════════════════════════════════════
// MICELLE / AVIDITY MODEL
// Ref: Missirlis et al. 2006 Mol Pharmaceutics 3:42
//      Hartgerink et al. 2001 Science 294:1684
//      Shimada et al. 2012 Langmuir 28:6819
//
// CMC 추정:
//   log10(CMC_µM) = 5.5 - 0.35 × n_carbon
//   (지방산 탄소수에 따른 log-linear 관계, 순수 지방산 기준)
//   펩타이드 꼬리로 인해 CMC는 실험값과 ±1 log unit 차이 가능
//
// Aggregation number (N):
//   N_C18 ≈ 60 (Missirlis 2006, C18-lipopeptide micelle)
//   N_C16 ≈ 50, N_C14 ≈ 35, N_C12 ≈ 20
//   음전하 linker (gGlu): 전하 반발 → N ↓ ~30%
//
// Avidity factor:
//   IC50_apparent = IC50_monomer / f_avid
//   f_avid ≈ √N × occupancy_factor   (통계역학 근사)
//   occupancy_factor ≈ 0.3-0.5 (미셀 표면 peptide 중 binding에 참여하는 비율)
//
// 불확도: ±2-3× (CMC), ±50% (avidity factor)
// ═══════════════════════════════════════════════════════════════════

function calcMicelleParams(atts, seq='') {
  const allFAs = Object.values(atts||{}).flat().filter(i=>i?.type==='fa');
  if (!allFAs.length) return null;

  const faId = allFAs[0].id;
  const fa = FAS.find(f=>f.id===faId);
  if (!fa) return null;

  const C = fa.C || 18;
  const isDiacid = fa.d || false;

  // CMC estimate (Tanford 1980; Missirlis 2006)
  let logCMC = 5.5 - 0.35 * C;
  if (isDiacid) logCMC += 0.5;

  const allLinkers = Object.values(atts||{}).flat().filter(i=>i?.type==='linker');
  const nGlu = allLinkers.filter(l=>['gGlu','gGluAEEA','gGlu2AEEA'].includes(l.id)).length;
  logCMC += nGlu * 0.4;

  const CMC_uM_base = Math.pow(10, logCMC);

  // Aggregation number (base, before position adjustment)
  const N_base = C <= 12 ? 20 : C <= 14 ? 35 : C <= 16 ? 50 : C <= 18 ? 60 : 80;
  const N_glu  = Math.round(N_base * (1 - nGlu * 0.12));

  // ── Position-dependent solvent exposure + CMC adjustment ─────────────────
  // 미셀 형성의 구동력은 FA의 용매 노출도와 회전 자유도에 비례
  // N-term/C-term: backbone 끝 → 완전 노출, 자유 회전 가능 → CMC 낮음 (미셀 잘 생김)
  // Side chain: backbone에 고정 → 자유도 제한, 미셀 코어 패킹 어려움 → CMC 높음
  // Ref: Shimada et al. 2012 Langmuir; Hartgerink 2001 Science
  //      Nussinov 2009 Biophys J (side-chain lipidation micelle behavior)

  let exposureFactor = 0.0;
  let logCMC_posAdj  = 0.0;  // position penalty on top of base CMC
  let posLabel       = '';

  for (const [posKey, chain] of Object.entries(atts||{})) {
    if (!chain?.some(i=>i?.type==='fa')) continue;
    if (posKey === 'nterm') {
      exposureFactor = Math.max(exposureFactor, 1.0);
      // No CMC penalty — classic lipopeptide N-term → best micelle former
      posLabel = 'N-term';
    } else if (posKey === 'cterm') {
      exposureFactor = Math.max(exposureFactor, 1.0);
      posLabel = 'C-term';
    } else {
      // Side chain: CMC raised by 0.4-0.7 log units (3-5× higher CMC)
      const m = posKey.match(/^r(\d+)$/);
      const aa = m ? (seq[parseInt(m[1])] || '?') : '?';
      // Lys: long, flexible side chain → more accessible → less penalty
      const exp  = aa === 'K' ? 0.80 : 0.65;
      const adj  = aa === 'K' ? 0.40 : 0.70;
      exposureFactor = Math.max(exposureFactor, exp);
      logCMC_posAdj  = Math.max(logCMC_posAdj, adj);
      posLabel = `${aa}${m?parseInt(m[1])+1:'?'} side chain`;
    }
  }

  // Final CMC with position adjustment
  const logCMC_final = logCMC + logCMC_posAdj;
  const CMC_uM       = Math.pow(10, logCMC_final);

  // Aggregation number — reduced for side chain FA (harder to pack)
  const N = Math.max(5, Math.round(N_glu * exposureFactor));

  // Avidity factor (Missirlis 2006)
  // f_avid = √N × occupancy × exposure
  // occupancy: ~35% of micellar peptides bind simultaneously
  const f_avid_raw = Math.sqrt(N) * 0.35 * exposureFactor;
  const f_avid = Math.max(1.0, f_avid_raw);

  return {
    faId, C, isDiacid,
    CMC_uM:      Math.max(0.001, CMC_uM),
    CMC_low_uM:  CMC_uM / 5,
    CMC_high_uM: CMC_uM * 5,
    CMC_posAdj:  logCMC_posAdj,
    posLabel,
    N, exposureFactor, f_avid,
    nGlu,
  };
}

// ═══════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
// 가설 3: FA에 의한 β-strand Pre-organization
// FA tail이 FB core 소수성 잔기(V8,T6,T7,F5,T9)와 분자 내 소수성 접촉
// → 결합 시 conformational entropy 손실 감소 → IC50 개선
//
// 근거: conformational entropy ΔS ≈ 1-3 cal/mol/K/잔기 (Spolar & Record 1994)
//       10 aa β-strand: ΔΔG_conf ≈ -1.0~-2.0 kcal/mol → 5-30× 개선 가능
//       현실적 추정 (부분 pre-org): 1.5-4× 개선
//
// 위치 의존성:
//   N-term FA, d=0-1: FA tail이 FB core V/T 잔기와 직접 접촉 → 최대 효과
//   Linker 있으면 tail이 더 유연 → 효과 감소
// ═══════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
// 가설 자동 분석 — 시퀀스 + FA 위치 기반
// 각 가설이 현재 조건에서 물리적으로 타당한지 판단
// ═══════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// BINDING MODE PREDICTION
// Determines whether a peptide-target interaction is likely
// helix-driven, β-strand-driven, or extended/loop-driven.
//
// Method:
//   2. Other targets: analyze peptide secondary structure propensity
//      + target surface characteristics (charge, hydrophobicity pattern)
//
// Why this matters for FA design:
//   Helix → FA at N-term stabilizes helix (Ward 2013) → potency ↑
//   β-strand → FA must avoid binding surface (all residues face target)
//             → FA only at non-binding extensions (JM, C-term)
// ═══════════════════════════════════════════════════════════════════
function predictBindingMode(seq, tgtSeq, fbStart) {
  // General: analyze peptide propensities
  const up = seq.toUpperCase();
  const helixPs = calcHelixP(up);
  const betaPs  = calcBetaP(up);

  // Binding region = whole peptide (if short) or just the N-terminal 2/3
  const bindLen = Math.min(seq.length, Math.ceil(seq.length * 0.7));
  const hAvg = helixPs.slice(0, bindLen).reduce((a,b)=>a+b,0) / bindLen;
  const bAvg = betaPs.slice(0, bindLen).reduce((a,b)=>a+b,0) / bindLen;

  // Alternating hydrophobic pattern → β-strand signature
  let altHydro = 0;
  for (let i = 0; i < bindLen - 1; i++) {
    const hi = AA[up[i]]?.hydro ?? 0;
    const hj = AA[up[i+1]]?.hydro ?? 0;
    if ((hi > 0.3 && hj < 0) || (hi < 0 && hj > 0.3)) altHydro++;
  }
  const altScore = altHydro / (bindLen - 1);

  // Target surface analysis
  const tgt = (tgtSeq||'').toUpperCase();
  const tgtQ = qAtPH(tgt, 7.4, false);
  const tgtGravy = seqGravy(tgt) || 0;

  // Decision
  let mode, confidence, label, labelEn, color, icon, desc, faAdvice, helixBenefit;

  if (hAvg > 1.05 && hAvg > bAvg * 1.1) {
    mode = 'helix';
    confidence = hAvg > 1.15 ? 'high' : 'medium';
    label = 'α-helix 결합'; labelEn = 'α-helix';
    color = '#16a34a'; icon = 'α';
    desc = `Chou-Fasman helix propensity 높음(${hAvg.toFixed(2)}). FA N-term 부착 시 helix 안정화 → potency 향상 가능 (Ward 2013 기반).`;
    faAdvice = 'N-term FA → helix nucleation 효과 (Ward 2013). K 또는 linker로 연결 권장. Helix 안에 FA 부착은 피할 것.';
    helixBenefit = true;
  } else if (bAvg > 1.05 && bAvg > hAvg) {
    mode = 'beta_strand';
    confidence = altScore > 0.3 ? 'medium' : 'low';
    label = 'β-strand 결합 (추정)'; labelEn = 'β-strand';
    color = '#2563eb'; icon = '𝛽';
    desc = `β-strand propensity 높음(${bAvg.toFixed(2)})${altScore > 0.3 ? ', 교차 소수성 패턴 확인' : ''}. 모든 잔기가 결합 표면에 접촉할 가능성. AlphaFold3 검증 권장.`;
    faAdvice = 'FA는 결합 core 밖(C-term 또는 JM region)에만. Core 내 FA = steric clash 위험.';
    helixBenefit = false;
  } else {
    mode = 'extended_loop';
    confidence = 'low';
    label = 'Extended loop (불분명)'; labelEn = 'loop/unknown';
    color = '#d97706'; icon = '?';
    desc = `Helix/β-strand propensity 모두 보통. Extended loop 또는 induced-fit 결합 가능성. AlphaFold3 구조 예측 권장.`;
    faAdvice = 'FA 위치 최적화를 위해 AlphaFold3 복합체 구조 예측 필요. 일반적으로 C-term 부착이 가장 안전.';
    helixBenefit = false;
  }

  return {
    mode, confidence, source: 'Chou-Fasman propensity',
    label, labelEn, color, icon, description: desc, faAdvice, helixBenefit,
    hAvg: hAvg.toFixed(2), bAvg: bAvg.toFixed(2), altScore: altScore.toFixed(2),
    faSafePositions: [], faDangerPositions: [],
    preorgMechanism: helixBenefit ? 'α-helix 안정화' : 'β-strand/extended conformation',
  };
}


// ─── Qualitative binding criteria ───
function qualityCriteria(pepSeq, tgtSeq, pepQ74, tgtQ74, muH, avgHP) {
  const HPHO = new Set('AILVMFW');
  const qP = pepQ74 * tgtQ74;
  const fNP_pep = [...pepSeq].filter(a=>HPHO.has(a)).length/pepSeq.length;
  const fNP_tgt = [...tgtSeq].filter(a=>HPHO.has(a)).length/tgtSeq.length;
  const nCysTgt = [...tgtSeq].filter(a=>a==='C').length;
  const sizeRatio = Math.min(pepSeq.length,tgtSeq.length)/Math.max(pepSeq.length,tgtSeq.length);
  const HBD = new Set('QNSTYWHKR');
  const HBA = new Set('QNSTEDRHKY');
  const nHBD_pep = [...pepSeq].filter(a=>HBD.has(a)).length;
  const nHBA_tgt = [...tgtSeq].filter(a=>HBA.has(a)).length;
  const hbScore = Math.min(5, Math.floor((nHBD_pep/pepSeq.length + nHBA_tgt/tgtSeq.length)*10));

  return [
    {
      name:'Charge complementarity', max:5,
      score: qP<-25?5 : qP<-15?4 : qP<-7?3 : qP<-2?2 : qP<0?1:0,
      note:`Z₁×Z₂ = ${qP.toFixed(1)} ${qP<-10?'→ strong driving force':qP<0?'→ moderate':'→ unfavorable/neutral'}`,
      ref:'Schreiber & Fersht 1993 Biochemistry 32:5145',
    },
    {
      name:'Hydrophobic burial potential', max:5,
      score: Math.min(5,Math.round((fNP_pep+fNP_tgt)*5)),
      note:`pep ${(fNP_pep*100).toFixed(0)}% / tgt ${(fNP_tgt*100).toFixed(0)}% nonpolar`,
      ref:'Eisenberg & McLachlan 1986 Nature 319:199',
    },
    {
      name:'H-bond / polar complementarity', max:5,
      score: Math.min(5,hbScore),
      note:`${nHBD_pep} donors in pep · ${nHBA_tgt} acceptors in tgt`,
      ref:'Fersht 1988 Biochemistry 27:1577',
    },
    {
      name:'Amphipathic structure (μH)', max:5,
      score: muH>0.5?5 : muH>0.35?4 : muH>0.2?3 : muH>0.08?2:1,
      note:`μH = ${muH.toFixed(3)} (Eisenberg 1982); helix pHx = ${avgHP.toFixed(2)}`,
      ref:'Eisenberg et al. 1982 Nature 299:371',
    },
    {
      name:'Target scaffold rigidity', max:5,
      score: nCysTgt>=8?5 : nCysTgt>=4?4 : nCysTgt>=2?3:2,
      note:`${nCysTgt} Cys in target → ${nCysTgt>=4?'disulfide-stabilized (low entropy cost)':'flexible (high entropy cost)'}`,
      ref:'Janin J & Rodier F 1995 Proteins 23:580',
    },
  ];
}

// ─── (B) Physics breakdown (EDUCATIONAL ONLY — sum gives wrong Kd without structure) ───
function scoreBinding(pepSeq, tgtSeq, pepQ74, tgtQ74, pepGravy, tgtGravy, muH, avgHP, nDAA, hasFA){
  if(!pepSeq.length||!tgtSeq.length) return null;
  const HPHO = new Set('AILVMFW');
  const HBD  = new Set('QNSTYWHKR');
  const HBA  = new Set('QNSTEDRHKY');
  const n_iface = Math.min(Math.floor(Math.min(pepSeq.length,tgtSeq.length)*0.35),15);
  const eps=80, kappa=0.1273, d_Ang=10.0, coulomb=332;
  const dG_elec = (coulomb*pepQ74*tgtQ74*Math.exp(-kappa*d_Ang))/(eps*d_Ang);
  const avgSASA_pep=[...pepSeq].reduce((s,a)=>s+(RESIDUE_SASA[a]||150),0)/pepSeq.length;
  const avgSASA_tgt=[...tgtSeq].reduce((s,a)=>s+(RESIDUE_SASA[a]||150),0)/tgtSeq.length;
  const fNP_pep=[...pepSeq].filter(a=>HPHO.has(a)).length/pepSeq.length;
  const fNP_tgt=[...tgtSeq].filter(a=>HPHO.has(a)).length/tgtSeq.length;
  const dASA_NP=fNP_pep*avgSASA_pep*n_iface*0.28+fNP_tgt*avgSASA_tgt*n_iface*0.15;
  const dG_hydro=-0.025*dASA_NP;
  const ifaceArea=n_iface*(avgSASA_pep+avgSASA_tgt)/2*0.20;
  const nHBD_pep=[...pepSeq].filter(a=>HBD.has(a)).length;
  const nHBA_tgt=[...tgtSeq].filter(a=>HBA.has(a)).length;
  const nHB_area=Math.floor(ifaceArea/200);
  const nHB_count=Math.min(nHBD_pep,nHBA_tgt,Math.floor(n_iface/3));
  const nHB=Math.round((nHB_area+nHB_count)/2);
  const dG_hbond=-1.0*nHB;
  const dG_TR=+5.5;
  const dAA_frac=nDAA/Math.max(pepSeq.length,1);
  const dG_conf=+0.18*Math.min(pepSeq.length,20)*(1-0.25*dAA_frac);
  const dG_helix=-1.2*muH*Math.min(1.0,avgHP/1.1);
  const dG_fa=hasFA?(tgtGravy>0.2?-0.8:tgtGravy<-0.4?+0.5:+0.1):0.0;
  const dG_total=dG_elec+dG_hydro+dG_hbond+dG_helix+dG_TR+dG_conf+dG_fa;
  return{
    dG_total,
    comps:[
      {label:'① Electrostatic (Debye-Hückel)',      dG:dG_elec,
       note:`Z₁=${pepQ74.toFixed(1)}e, Z₂=${tgtQ74.toFixed(1)}e, d=10Å, ε=80, κ=0.1273Å⁻¹ (I=0.15M)`,
       formula:'ΔG = (332·Z₁Z₂/εd)·exp(−κd)',
       ref:'Sheinerman & Honig 2002 JMB 318:161'},
      {label:'② Nonpolar SASA burial (Spolar-Record)',dG:dG_hydro,
       note:`ΔSASA_NP≈${dASA_NP.toFixed(0)}Å²; pep ${(fNP_pep*100).toFixed(0)}% / tgt ${(fNP_tgt*100).toFixed(0)}% hydrophobic`,
       formula:'ΔG_np = −25 cal mol⁻¹ Å⁻² × ΔSASA_NP',
       ref:'Spolar & Record 1994 Science 263:777; Miller et al. 1987 JMB 196:641'},
      {label:'③ H-bond network (Fersht)',           dG:dG_hbond,
       note:`~${nHB} HBs (area est: ${nHB_area}, count est: ${nHB_count})`,
       formula:'ΔG_HB = −1.0 kcal/mol per HB; ~1 HB per 200Å²',
       ref:'Fersht 1988 Biochemistry 27:1577; Chakrabarti & Janin 2002 Proteins 47:334'},
      {label:'④a T+R entropy (Williams)',           dG:dG_TR,
       note:`Fixed penalty: +5.5 kcal/mol (≈12 kBT). This is why sequence-only models fail for tight binders.`,
       formula:'ΔG_TR = +5.5 kcal/mol (standard state 1M)',
       ref:'Williams et al. 2003 Curr Opin Chem Biol 7:57'},
      {label:'④b Conf. entropy (Doig-Sternberg)',   dG:dG_conf,
       note:`+${dG_conf.toFixed(2)} kcal/mol; ${Math.min(pepSeq.length,20)} residues × 0.18`,
       formula:'ΔG_conf = +0.18 kcal/mol per ordered residue',
       ref:'Doig & Sternberg 1995 Protein Sci 4:2247'},
      {label:'⑤ Amphipathic helix (Eisenberg)',     dG:dG_helix,
       note:`μH=${muH.toFixed(3)}, pHx=${avgHP.toFixed(2)}`,
       formula:'ΔG_helix = −1.2 × μH × min(1, pHx/1.1)',
       ref:'Eisenberg et al. 1982 Nature 299:371'},
    ],
  };
}

// ═══════════════════════════════════════════════════════
// HELICAL WHEEL
// ═══════════════════════════════════════════════════════
function HelixWheel({seq,dAA,atts,effectiveType,effectiveHydro}){
  if(!seq.length) return null;
  const cx=160,cy=160,R=118,n=Math.min(seq.length,20);
  const d=100*Math.PI/180;

  // µH vector direction — uses effectiveHydro (FA-boosted)
  let msx=0,msy=0;
  for(let i=0;i<n;i++){
    const h=effectiveHydro?.[i]??AA[seq[i]]?.hydro??0;
    const angle=dAA?.[i]?(i*d+Math.PI):(i*d);
    msx+=h*Math.cos(angle); msy+=h*Math.sin(angle);
  }
  const mLen=Math.sqrt(msx*msx+msy*msy);
  const aLen=52;
  const ax=mLen>0?cx+aLen*(msx/mLen):cx;
  const ay=mLen>0?cy+aLen*(msy/mLen):cy;

  const items=Array.from({length:n},(_,i)=>{
    const baseAngle=i*d-Math.PI/2;
    const angle=dAA?.[i]?baseAngle+Math.PI:baseAngle;
    const x=cx+R*Math.cos(angle), y=cy+R*Math.sin(angle);
    const chain=atts?.[`r${i}`]||[];
    const hasFA=chain.some(c=>c?.type==='fa');
    const inFBCore=false;
    // Use effectiveType: FA-modified residue shows as hydrophobic color
    const eType=effectiveType?.[i]??(AA[seq[i]]?.t??'S');
    return{aa:seq[i],i,x,y,isD:!!dAA?.[i],hasFA,inFBCore,eType};
  });

  const nTermFA=atts?.['nterm']?.some(c=>c?.type==='fa');
  const cTermFA=atts?.['cterm']?.some(c=>c?.type==='fa');

  return(
    <svg viewBox="0 0 320 320" style={{width:'100%',maxWidth:320}}>
      {/* µH direction arrow */}
      {mLen>0.01&&(
        <g opacity={0.6}>
          <line x1={cx} y1={cy} x2={ax} y2={ay}
            stroke="var(--color-text-info)" strokeWidth={2.5} strokeLinecap="round"/>
          <circle cx={ax} cy={ay} r={4} fill="var(--color-text-info)"/>
          <text x={ax+(ax-cx)*0.3} y={ay+(ay-cy)*0.3+1}
            fontSize="8.5" fill="var(--color-text-info)" textAnchor="middle"
            dominantBaseline="middle">µH</text>
        </g>
      )}
      {/* Connector lines */}
      {items.map((it,idx)=>idx===0?null:(
        <line key={`l${idx}`}
          x1={items[idx-1].x} y1={items[idx-1].y}
          x2={it.x} y2={it.y}
          stroke={it.inFBCore?'var(--color-border-success)':'var(--color-border-secondary)'}
          strokeWidth={it.inFBCore?1.5:0.8}/>
      ))}
      {/* Residue nodes */}
      {items.map(({aa,i,x,y,isD,hasFA,inFBCore,eType})=>{
        const col=TYPE_HEX[eType]??TYPE_HEX['S'];
        return(
          <g key={i}>
            {hasFA&&<circle cx={x} cy={y} r={22} fill="none"
              stroke="var(--color-border-warning)" strokeWidth={2.5} strokeDasharray="4,3"/>}
            {inFBCore&&!hasFA&&<circle cx={x} cy={y} r={19} fill="none"
              stroke="var(--color-border-success)" strokeWidth={1.5} strokeOpacity={0.5}/>}
            {isD&&<circle cx={x} cy={y} r={17} fill="none"
              stroke="var(--color-text-primary)" strokeWidth={2} strokeDasharray="3,2"/>}
            <circle cx={x} cy={y} r={14}
              fill={col.bg} stroke={hasFA?col.border:inFBCore?'var(--color-border-success)':col.border}
              strokeWidth={hasFA?2:inFBCore?1.5:0.5}/>
            <text x={x} y={y+1} textAnchor="middle" dominantBaseline="middle"
              fontSize="12" fontWeight="500" fill={col.text}>{aa}</text>
            <text x={x} y={y+10} textAnchor="middle"
              fontSize="7.5" fill={col.text} opacity={0.7}>{i+1}</text>
            {isD&&<text x={x+10} y={y-9} fontSize="7" fontWeight="700"
              fill="var(--color-text-primary)">D</text>}
            {hasFA&&<text x={x+11} y={y+14} fontSize="7" fontWeight="700"
              fill="var(--color-text-warning)">FA</text>}
          </g>
        );
      })}
      <text x={cx} y={14} textAnchor="middle" fontSize="10"
        fill="var(--color-text-secondary)">↑ N-term{nTermFA?' 🔶':''}</text>
      {n<seq.length&&<text x={cx} y={308} textAnchor="middle" fontSize="9"
        fill="var(--color-text-secondary)">(showing 1–{n} of {seq.length})</text>}
      {cTermFA&&<text x={cx} y={296} textAnchor="middle" fontSize="9"
        fill="var(--color-text-warning)">C-term 🔶 FA</text>}
      <g transform="translate(4,275)">
        {[
          {col:'var(--color-border-warning)',dash:'4,3',w:2.5,label:'FA 수식'},
          {col:'var(--color-text-primary)',dash:'3,2',w:2,label:'D-AA'},
          {col:'var(--color-text-info)',dash:'',w:2.5,label:'µH 방향'},
        ].map((l,i)=>(
          <g key={i} transform={`translate(${i*74},0)`}>
            <line x1={0} y1={5} x2={14} y2={5}
              stroke={l.col} strokeWidth={l.w} strokeDasharray={l.dash}/>
            <text x={17} y={9} fontSize="8" fill="var(--color-text-secondary)">{l.label}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════
// CHAIN EDITOR
// ═══════════════════════════════════════════════════════
function ChainEditor({posKey,label,chain,onChange,onClose}){
  const LINKERS_LNK = LINKERS.filter(l=>l.cat==='linker');
  const LINKERS_SPC = LINKERS.filter(l=>l.cat==='spacer');
  const [selL,setSelL]=useState(LINKERS_LNK[0]?.id||'AEEA1');
  const [selS,setSelS]=useState(LINKERS_SPC[0]?.id||'Gly');
  const [selF,setSelF]=useState('C18d');
  const [selC,setSelC]=useState(CLEAVABLE_LINKERS[0]?.id||'hydrazone');
  const [addTab,setAddTab]=useState('linker');
  const add=(type,id)=>onChange(posKey,[...chain,{type,id}]);
  const remove=idx=>onChange(posKey,chain.filter((_,i)=>i!==idx));
  const swap=(a,b)=>{const c=[...chain];[c[a],c[b]]=[c[b],c[a]];onChange(posKey,c);};
  const total=chainMW(chain);
  const sel={padding:'6px 8px',fontSize:12,width:'100%',
    background:'var(--color-background-primary)',color:'var(--color-text-primary)',
    border:'0.5px solid var(--color-border-secondary)',borderRadius:'var(--border-radius-md)'};
  const addBtn={padding:'5px 10px',fontSize:11,cursor:'pointer',fontWeight:500,whiteSpace:'nowrap',
    background:'var(--color-background-info)',color:'var(--color-text-info)',
    border:'0.5px solid var(--color-border-info)',borderRadius:'var(--border-radius-md)'};
  const ib=(d)=>({width:19,height:19,padding:0,fontSize:9,lineHeight:1,cursor:'pointer',
    background:d?'var(--color-background-danger)':'var(--color-background-secondary)',
    color:d?'var(--color-text-danger)':'var(--color-text-secondary)',
    border:`0.5px solid ${d?'var(--color-border-danger)':'var(--color-border-tertiary)'}`,borderRadius:3});
  const getItemCat = item => item.type==='fa' ? 'fa' : item.type==='cleavable' ? 'cleavable' : (LINKERS.find(l=>l.id===item.id)?.cat||'linker');
  const catStyle = cat => cat==='fa'
    ? {bg:'#FAEEDA',fg:'#633806',border:'#BA7517',label:'FA'}
    : cat==='spacer'
    ? {bg:'#f0fdf4',fg:'#15803d',border:'#86efac',label:'SPC'}
    : cat==='cleavable'
    ? {bg:'#faf5ff',fg:'#7c3aed',border:'#c4b5fd',label:'✂CLV'}
    : {bg:'var(--color-background-info)',fg:'var(--color-text-info)',border:'var(--color-border-info)',label:'LNK'};
  const TABS=[{id:'linker',label:'Linker'},{id:'spacer',label:'Spacer'},{id:'fa',label:'FA'},{id:'cleavable',label:'✂ Cleavable'}];
  return(
    <div style={{border:'0.5px solid var(--color-border-info)',borderRadius:'var(--border-radius-lg)',
      background:'var(--color-background-tertiary)',padding:14,marginBottom:10}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div>
          <span style={{fontSize:13,fontWeight:500,color:'var(--color-text-primary)'}}>Chain editor</span>
          <span style={{fontSize:12,color:'var(--color-text-info)',marginLeft:8}}>@ {label}</span>
        </div>
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',
          color:'var(--color-text-secondary)',fontSize:16,lineHeight:1,padding:'0 4px'}}>✕</button>
      </div>
      {chain.length>0&&(
        <div style={{fontSize:10,color:'var(--color-text-secondary)',marginBottom:8,
          padding:'4px 8px',background:'var(--color-background-secondary)',borderRadius:'var(--border-radius-md)',
          wordBreak:'break-all',lineHeight:1.6}}>NH₂ → {chain.map(i=>itemLabel(i)).join(' → ')}</div>
      )}
      {chain.length===0?(
        <div style={{fontSize:11,color:'var(--color-text-secondary)',textAlign:'center',
          padding:'10px 0',marginBottom:10,borderBottom:'0.5px solid var(--color-border-tertiary)'}}>No modifications yet</div>
      ):(
        <div style={{marginBottom:10,borderBottom:'0.5px solid var(--color-border-tertiary)',paddingBottom:10}}>
          {chain.map((item,idx)=>{
            const cat=getItemCat(item);
            const cs=catStyle(cat);
            return(
              <div key={idx} style={{display:'flex',alignItems:'center',gap:5,marginBottom:5}}>
                <span style={{fontSize:10,color:'var(--color-text-secondary)',minWidth:14,textAlign:'center'}}>{idx+1}</span>
                <span style={{fontSize:10,padding:'2px 6px',borderRadius:999,fontWeight:500,
                  background:cs.bg,color:cs.fg,border:`0.5px solid ${cs.border}`}}>{cs.label}</span>
                <span style={{flex:1,fontSize:12,color:'var(--color-text-primary)',fontFamily:'var(--font-mono)',
                  overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{itemLabel(item)}</span>
                <span style={{fontSize:10,color:'var(--color-text-success)',fontFamily:'var(--font-mono)',minWidth:56,textAlign:'right'}}>
                  +{itemMW(item).toFixed(1)} Da</span>
                <button onClick={()=>swap(idx,idx-1)} disabled={idx===0} style={{...ib(false),opacity:idx===0?0.25:1}}>▲</button>
                <button onClick={()=>swap(idx,idx+1)} disabled={idx===chain.length-1} style={{...ib(false),opacity:idx===chain.length-1?0.25:1}}>▼</button>
                <button onClick={()=>remove(idx)} style={ib(true)}>×</button>
              </div>
            );
          })}
          <div style={{display:'flex',justifyContent:'flex-end',gap:6,marginTop:6,fontSize:11,color:'var(--color-text-secondary)'}}>
            <span>Total ΔMW:</span>
            <span style={{color:'var(--color-text-success)',fontFamily:'var(--font-mono)',fontWeight:500}}>+{total.toFixed(2)} Da</span>
          </div>
        </div>
      )}
      {/* ── 3-tab add panel ── */}
      <div style={{display:'flex',gap:2,marginBottom:8}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setAddTab(t.id)} style={{
            flex:1,padding:'5px 0',fontSize:11,cursor:'pointer',fontWeight:addTab===t.id?600:400,
            borderRadius:'var(--border-radius-md)',border:'0.5px solid var(--color-border-secondary)',
            background:addTab===t.id?'var(--color-background-info)':'var(--color-background-secondary)',
            color:addTab===t.id?'var(--color-text-info)':'var(--color-text-secondary)'}}>
            {t.label}
          </button>
        ))}
      </div>
      {addTab==='linker'&&(
        <div style={{marginBottom:8}}>
          <div style={{fontSize:10,color:'var(--color-text-secondary)',marginBottom:4}}>
            PEG / AEEA / OEG / γ-Glu — albumin binding &amp; solubility
          </div>
          <div style={{display:'flex',gap:6}}>
            <select value={selL} onChange={e=>setSelL(e.target.value)} style={sel}>
              {LINKERS_LNK.map(l=><option key={l.id} value={l.id}>{l.lab}  (+{(l.mw-WATER).toFixed(1)} Da)</option>)}
            </select>
            <button onClick={()=>add('linker',selL)} style={addBtn}>+ Add</button>
          </div>
        </div>
      )}
      {addTab==='spacer'&&(
        <div style={{marginBottom:8}}>
          <div style={{fontSize:10,color:'var(--color-text-secondary)',marginBottom:4}}>
            Gly / β-Ala / Ahx / Pro — neutral connectors &amp; rigidity
          </div>
          <div style={{display:'flex',gap:6}}>
            <select value={selS} onChange={e=>setSelS(e.target.value)} style={sel}>
              {LINKERS_SPC.map(l=><option key={l.id} value={l.id}>{l.lab}  (+{(l.mw-WATER).toFixed(1)} Da)</option>)}
            </select>
            <button onClick={()=>add('linker',selS)} style={addBtn}>+ Add</button>
          </div>
        </div>
      )}
      {addTab==='fa'&&(
        <div style={{marginBottom:8}}>
          <div style={{fontSize:10,color:'var(--color-text-secondary)',marginBottom:4}}>
            Fatty acid — albumin binding &amp; half-life extension
          </div>
          <div style={{display:'flex',gap:6}}>
            <select value={selF} onChange={e=>setSelF(e.target.value)} style={sel}>
              {FAS.map(f=><option key={f.id} value={f.id}>{f.lab}  (+{(f.mw-WATER).toFixed(1)} Da)</option>)}
            </select>
            <button onClick={()=>add('fa',selF)} style={addBtn}>+ Add</button>
          </div>
        </div>
      )}
      {addTab==='cleavable'&&(
        <div style={{marginBottom:8}}>
          <div style={{fontSize:10,color:'var(--color-text-secondary)',marginBottom:4}}>
            ✂ Cleavable linker — endosome pH/enzyme에서 절단
          </div>
          <div style={{display:'flex',gap:6}}>
            <select value={selC} onChange={e=>setSelC(e.target.value)} style={sel}>
              {CLEAVABLE_LINKERS.map(c=><option key={c.id} value={c.id}>{c.lab} (pH {c.cleavagePH}, serum {c.serumStab})</option>)}
            </select>
            <button onClick={()=>add('cleavable',selC)} style={{...addBtn,background:'#faf5ff',color:'#7c3aed',border:'1px solid #c4b5fd'}}>+ Add</button>
          </div>
          {(()=>{const cl=CLEAVABLE_LINKERS.find(c=>c.id===selC);return cl?(
            <div style={{fontSize:9,color:'var(--color-text-secondary)',marginTop:4,lineHeight:1.5}}>
              {cl.mechanism}{cl.notes?` · ${cl.notes}`:''}
            </div>
          ):null;})()}
        </div>
      )}
      {chain.length>0&&(
        <button onClick={()=>onChange(posKey,[])} style={{padding:'5px 12px',fontSize:11,cursor:'pointer',width:'100%',
          background:'var(--color-background-danger)',color:'var(--color-text-danger)',
          border:'0.5px solid var(--color-border-danger)',borderRadius:'var(--border-radius-md)'}}>Clear all</button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// BINDING SCORE COMPONENT CHART (inline SVG bar)
// ═══════════════════════════════════════════════════════
function ScoreBar({comps}){
  if(!comps) return null;
  const maxAbs=Math.max(...comps.map(c=>Math.abs(c.dG)),0.5);
  const barWidth=160;
  return(
    <div style={{display:'flex',flexDirection:'column',gap:6}}>
      {comps.map((c,i)=>{
        const isNeg=c.dG<=0;
        const frac=Math.abs(c.dG)/maxAbs;
        const w=frac*barWidth;
        const col=isNeg?'var(--color-text-success)':'var(--color-text-danger)';
        return(
          <div key={i}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
              <div style={{fontSize:11,color:'var(--color-text-secondary)',minWidth:160,flex:'0 0 160px',
                overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.label}</div>
              <div style={{position:'relative',width:barWidth+60,height:14,display:'flex',alignItems:'center'}}>
                {/* Zero line at center */}
                <div style={{position:'absolute',left:barWidth/2,top:0,width:1,height:14,
                  background:'var(--color-border-secondary)'}}></div>
                {/* Bar */}
                <div style={{
                  position:'absolute',
                  right: isNeg ? barWidth/2 : 'auto',
                  left:  isNeg ? 'auto' : barWidth/2,
                  width:w,height:10,top:2,borderRadius:2,
                  background:col,opacity:0.8,
                }}></div>
                {/* Value label */}
                <div style={{
                  position:'absolute',
                  left:isNeg?barWidth/2-w-40:barWidth/2+w+2,
                  fontSize:10,fontFamily:'var(--font-mono)',
                  color:col,whiteSpace:'nowrap',fontWeight:500,
                }}>{c.dG>=0?'+':''}{c.dG.toFixed(2)}</div>
              </div>
            </div>
            <div style={{fontSize:10,color:'var(--color-text-secondary)',marginLeft:168,lineHeight:1.3}}>
              {c.note}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════
export default function PeptideAnalyzer(){
  const [rawSeq,   setRawSeq  ] = useState('HAEGTFTSDVSSYLEGQAAKEFIAWLVKGR');
  const [dAA,      setDAA     ] = useState({});
  const [nnAA,     setNnAA    ] = useState({}); // {posIdx: 'Aib'|'Nle'|...}
  const [nnAAEdit, setNnAAEdit] = useState(null); // idx of position being edited
  const [cAmide,   setCAmide  ] = useState(true);
  const [history, setHistory] = useState(() => {
    try {
      const s = localStorage.getItem('peptide_history');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });
  const saveToHistory = (entry) => {
    setHistory(prev => {
      const next = [{...entry, savedAt: new Date().toLocaleString('ko-KR')}, ...prev].slice(0,20);
      try { localStorage.setItem('peptide_history', JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const [atts,     setAtts    ] = useState({});
  const [tab,      setTab     ] = useState('props');
  const [editing,  setEditing ] = useState(null);
  const [target,   setTarget  ] = useState('albumin');
  const [tgtName,  setTgtName ] = useState('');
  const [tgtRaw,   setTgtRaw  ] = useState('');
  // Experimental conditions removed (FAM19A5-specific)
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading,setAiLoading]=useState(false);
  const [aiError,  setAiError ] = useState(null);
  const [pinnedConfigs, setPinnedConfigs] = useState([]); // unlimited pinned variants for comparison
  const [optWeights, setOptWeights] = useState({bbb:3,binding:3,albKd:2,halfLife:2,protease:2,drugLike:1,immuno:1});

  // ── BPP (BBB Shuttle Peptide) ──────────────────────────────
  const [bppId,    setBppId   ] = useState('none');
  const [bppPos,   setBppPos  ] = useState('cterm'); // 'nterm' | 'cterm' | 'r5' (Lys branch at index 5)
  const [bppDaa,   setBppDaa  ] = useState({}); // D-AA map for BPP residues {0:true, 3:true, ...}
  const [bppCustomSeq, setBppCustomSeq] = useState('');
  const [bppRetroInverso, setBppRetroInverso] = useState(false);
  const [bppBondType, setBppBondType] = useState('stable'); // 'stable' or cleavable linker id
  const [structData, setStructData] = useState(null); // parsed AlphaFold3 structure
  // Cleavable linker detected from chain (not separate state anymore)
  const detectedCleavable = useMemo(()=>{
    for(const chain of Object.values(atts)){
      if(!chain) continue;
      for(const item of chain){
        if(item.type==='cleavable'){
          return CLEAVABLE_LINKERS.find(c=>c.id===item.id) || null;
        }
      }
    }
    return null;
  },[atts]);
  const cleavLinkId = detectedCleavable?.id || 'none';
  const cleavLinkObj = detectedCleavable || {id:'none',lab:'None',cleavagePH:'—',halfLife:'—',serumStab:'—',mechanism:'—',notes:''};

  const bppObj = useMemo(()=> BPPS.find(b=>b.id===bppId) || BPPS[0], [bppId]);
  const bppSeqBase = useMemo(()=> bppId==='custom' ? bppCustomSeq.toUpperCase().replace(/[^ACDEFGHIKLMNPQRSTVWY]/g,'') : (bppObj.seq||''), [bppId, bppObj, bppCustomSeq]);
  // Retro-inverso: reverse the sequence (D-form is handled by bppDaa)
  const bppSeq = useMemo(()=> bppRetroInverso ? [...bppSeqBase].reverse().join('') : bppSeqBase, [bppSeqBase, bppRetroInverso]);
  // cleavLinkObj is now computed from chain detection above
  const bppNdaa = useMemo(()=> Object.values(bppDaa).filter(Boolean).length, [bppDaa]);
  const bppIsLysBranch = bppPos.startsWith('r'); // Lys side-chain branch

  // Core peptide sequence (unchanged — all atts indices reference this)
  const seq    =useMemo(()=>rawSeq.toUpperCase().replace(/[^ACDEFGHIKLMNPQRSTVWY]/g,''),[rawSeq]);

  // Available Lys positions for BPP branching (must be after seq)
  const lysPositions = useMemo(()=>{
    const result=[];
    for(let i=0;i<seq.length;i++) if(seq[i]==='K') result.push({idx:i, label:`K${i+1}`});
    return result;
  },[seq]);
  // Combined sequence for total property calculations (MW, charge, protease)
  const fullSeq = useMemo(()=> bppPos==='nterm' ? bppSeq+seq : seq+bppSeq, [seq, bppSeq, bppPos]);
  // Combined D-AA count for PK calculations
  const totalDaaCount = useMemo(()=> Object.values(dAA).filter(Boolean).length + bppNdaa, [dAA, bppNdaa]);
  const tgtSeq =useMemo(()=>tgtRaw.toUpperCase().replace(/[^ACDEFGHIKLMNPQRSTVWY]/g,''),[tgtRaw]);

  const nnAAJson = JSON.stringify(nnAA);
  const mw      =useMemo(()=>calcMW(seq,cAmide,atts,nnAA),     [seq,cAmide,atts,nnAAJson]);
  const pI      =useMemo(()=>calcPI(seq,cAmide,nnAA),           [seq,cAmide,nnAAJson]);
  const q74     =useMemo(()=>seq.length?qAtPH(seq,7.4,cAmide,nnAA):0,[seq,cAmide,nnAAJson]);
  const gravy   =useMemo(()=>seqGravy(seq,nnAA),                [seq,nnAAJson]);

  // ── Total properties including BPP ──
  const bppMwCalc = useMemo(()=> bppSeq.length ? bppSeq.split('').reduce((s,a)=>(AA[a]?.mw??110)-WATER+s,0)+WATER : 0, [bppSeq]);
  const totalMw   = useMemo(()=> mw + bppMwCalc, [mw, bppMwCalc]);
  const totalPi   = useMemo(()=> bppSeq.length ? calcPI(bppPos==='nterm'?bppSeq+seq:seq+bppSeq, cAmide) : pI, [seq,bppSeq,bppPos,cAmide,pI]);
  const totalQ74  = useMemo(()=> bppSeq.length ? qAtPH(bppPos==='nterm'?bppSeq+seq:seq+bppSeq, 7.4, cAmide) : q74, [seq,bppSeq,bppPos,cAmide,q74]);
  const totalGravy= useMemo(()=> bppSeq.length ? seqGravy(bppPos==='nterm'?bppSeq+seq:seq+bppSeq) : gravy, [seq,bppSeq,bppPos,gravy]);

  // ── runKey + stable JSON strings — must be declared BEFORE anything that uses them ──
  const [runKey, setRunKey] = useState(0);
  const attsJson = useMemo(()=>JSON.stringify(atts),[atts]);
  const daaJson  = useMemo(()=>JSON.stringify(dAA),[dAA]);

  // FA-boosted effective hydrophobicity per residue
  const effectiveHydro = useMemo(()=>[...seq].map((aa,i)=>{
    let h = AA[aa]?.hydro??0;
    const chain = atts?.[`r${i}`]||[];
    const fa = chain.find(c=>c?.type==='fa');
    if(fa){
      const raw = FA_HYDRO_BOOST[fa.id]??1.5;
      const eff = fa.id==='C18d' ? raw-0.8 : raw;
      h = h < 0 ? h + eff : h + eff * 0.3;
    }
    return h;
  }),[seq,attsJson]);

  // effective amino acid type (for coloring) — FA-modified residues get 'H' (hydrophobic)
  const effectiveType = useMemo(()=>[...seq].map((aa,i)=>{
    const chain = atts?.[`r${i}`]||[];
    const hasFa = chain.some(c=>c?.type==='fa');
    return hasFa ? 'H' : (AA[aa]?.t??'S');
  }),[seq,attsJson]);

  const muH     =useMemo(()=>calcMuH(seq,dAA,atts),        [seq,daaJson,attsJson]);
  const helixPs =useMemo(()=>calcHelixP(seq),              [seq]);
  const betaPs  =useMemo(()=>calcBetaP(seq),               [seq]);
  const avgHP   =useMemo(()=>helixPs.length?helixPs.reduce((a,b)=>a+b,0)/helixPs.length:0,[helixPs]);
  const helixMod=useMemo(()=>calcModifiedHelix(seq,atts),  [seq,attsJson]);
  const micelleParams=useMemo(()=>calcMicelleParams(atts,seq),[attsJson,seq]);
  const ss      =useMemo(()=>predictSS(seq,helixPs,betaPs),[seq,helixPs,betaPs,fbStart]);
  const chargePr=useMemo(()=>{
    const s = bppSeq.length ? (bppPos==='nterm'?bppSeq+seq:seq+bppSeq) : seq;
    return s.length?Array.from({length:29},(_,i)=>({ph:i*0.5,q:qAtPH(s,i*0.5,cAmide,nnAA)})):[];
  },[seq,bppSeq,bppPos,cAmide,nnAAJson]);
  const kdEst   =useMemo(()=>{
    if(!seq.length) return null;
    if(target==='albumin') {
      const result = kdAlbumin(atts,seq);
      // BPP-FA proximity penalty: if BPP attachment is close to any FA attachment → albumin binding impaired
      if(result && bppSeq.length > 0) {
        const faPositions = Object.entries(atts)
          .filter(([,ch])=>ch?.some(i=>i?.type==='fa'))
          .map(([pk])=> pk==='nterm'?0 : pk==='cterm'?seq.length-1 : parseInt(pk.replace('r','')));
        const bppIdx = bppPos==='nterm'?0 : bppPos==='cterm'?seq.length-1 : parseInt(bppPos.replace('r',''));
        let minDist = 999;
        for(const fp of faPositions) minDist = Math.min(minDist, Math.abs(fp - bppIdx));
        // Same position = severe clash, nearby = moderate, far = no effect
        let bppAlbPenalty = 1.0;
        let bppAlbNote = '';
        if(minDist === 0) { bppAlbPenalty = 5.0; bppAlbNote = '⚠ BPP와 FA가 같은 위치 — albumin 결합 심각하게 저하'; }
        else if(minDist <= 3) { bppAlbPenalty = 2.0; bppAlbNote = '⚠ BPP가 FA 근처 — albumin 접근 부분 차단'; }
        else if(minDist <= 6) { bppAlbPenalty = 1.3; bppAlbNote = 'BPP-FA 거리 보통 — 약간의 steric 영향 가능'; }
        else { bppAlbNote = 'BPP와 FA 충분히 떨어져 있음 — 간섭 없음'; }
        if(bppAlbPenalty > 1.0 && result.positions) {
          result.positions = result.positions.map(p=>({...p, kd_nM: p.kd_nM * bppAlbPenalty}));
          result.best = result.best * bppAlbPenalty;
        }
        result.bppAlbPenalty = bppAlbPenalty;
        result.bppAlbNote = bppAlbNote;
      }
      return result;
    }
    if(target==='membrane') return {best:kdMembrane(seq,q74), positions:null};
    return null;
  },[seq,attsJson,target,q74,bppSeq,bppPos]);

  const tgtProps=useMemo(()=>{
    if(!tgtSeq.length) return null;
    return{mw:calcMW(tgtSeq,false,{}),pI:calcPI(tgtSeq,false),
      q74:qAtPH(tgtSeq,7.4,false),gravy:seqGravy(tgtSeq),muH:calcMuH(tgtSeq)};
  },[tgtSeq]);

  // ── Physicochemical scoring ──
  const nDAA    =useMemo(()=>Object.values(dAA).filter(Boolean).length,[daaJson]);
  const nnAACount=useMemo(()=>Object.keys(nnAA).length,[nnAAJson]);
  const nnAAProtR=useMemo(()=>Object.values(nnAA).filter(id=>NNAA[id]?.protR).length,[nnAAJson]);
  const hasFA   =useMemo(()=>Object.values(atts).some(chain=>chain?.some(i=>i.type==='fa')),[attsJson]);

  // track if result is stale (atts/dAA changed since last run)
  const lastRunRef = useRef({ attsJson:'', daaJson:'', seq:'', tgtSeq:'' });
  const isStale = useMemo(()=>{
    const r = lastRunRef.current;
    return r.attsJson !== attsJson || r.daaJson !== daaJson ||
           r.seq !== seq || r.tgtSeq !== tgtSeq;
  },[attsJson, daaJson, seq, tgtSeq, runKey]);

  const scoreResult=useMemo(()=>{
    if(!seq.length||!tgtSeq.length||!tgtProps) return null;
    lastRunRef.current = { attsJson, daaJson, seq, tgtSeq };
    const phys = scoreBinding(seq,tgtSeq,q74,tgtProps.q74,gravy,tgtProps.gravy,muH,helixMod.modifiedAvg,nDAA,hasFA);
    const emp  = empiricalKd(seq,tgtSeq,q74,tgtProps.q74,muH);
    const qual = qualityCriteria(seq,tgtSeq,q74,tgtProps.q74,muH,helixMod.modifiedAvg);
    // [General peptide mode - no target-specific IC50]
    return { phys, emp, qual, bindingMode };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[runKey, seq, tgtSeq, q74, tgtProps, gravy, muH, avgHP, nDAA, hasFA, bppSeq, bppPos, bppObj, bppId, structData]);


  // ── Top-level PK calculation (for Compare tab access) ──
  const pkCalc = useMemo(()=>{
    if(!seq.length) return null;
    const hasFa = Object.values(atts).flat().some(i=>i?.type==='fa');
    const allLinkerItems = Object.values(atts).flat().filter(i=>i?.type==='linker');
    const hasPEGLinker = allLinkerItems.some(l=>l.id?.startsWith('PEG')||['miniPEG','miniPEG2'].includes(l.id));
    const hasGluLinker = allLinkerItems.some(l=>['gGlu','gGluAEEA','gGlu2AEEA','gGlu3AEEA','gGlu2OEG','gGluOEG','isoGlu','isoGluAEEA','isoGlu2AEEA'].includes(l.id));
    const linkerTotalMW = allLinkerItems.reduce((s,l)=>s+(LINKERS.find(x=>x.id===l.id)?.mw||0),0);
    const effectiveMW = mw + linkerTotalMW + bppMwCalc;
    const dAACount = totalDaaCount;

    // DPP-4
    let pos2, pos2isD;
    if(bppSeq.length > 1 && bppPos==='nterm') { pos2=bppSeq[1]; pos2isD=!!bppDaa[1]; }
    else { pos2=seq[1]; pos2isD=!!dAA[1]; }
    // Aib at pos2 = DPP-4 resistant (like semaglutide)
    const pos2nnAA = (bppSeq.length>1&&bppPos==='nterm') ? null : nnAA[1];
    const pos2isNNProtR = pos2nnAA && NNAA[pos2nnAA]?.protR;
    const dpp4Risk = (pos2isD||pos2isNNProtR) ? 'LOW' : ((pos2==='A'||pos2==='P') ? 'HIGH' : 'LOW');

    // Protease sites (core) — skip D-AA and protease-resistant NNAA
    const trypsinSites=[], chymoSites=[];
    for(let i=0;i<seq.length-1;i++){
      if(dAA[i]) continue;
      if(nnAA[i] && NNAA[nnAA[i]]?.protR) continue; // NNAA protease resistant
      if(['K','R'].includes(seq[i]) && seq[i+1]!=='P') trypsinSites.push(`${seq[i]}${i+1}`);
      if(['F','Y','W','L'].includes(seq[i]) && seq[i+1]!=='P') chymoSites.push(`${seq[i]}${i+1}`);
    }
    // BPP protease sites
    for(let i=0;i<bppSeq.length-1;i++){
      if(bppDaa[i]) continue;
      if(['K','R'].includes(bppSeq[i]) && bppSeq[i+1]!=='P') trypsinSites.push(`BPP:${bppSeq[i]}${i+1}`);
      if(['F','Y','W','L'].includes(bppSeq[i]) && bppSeq[i+1]!=='P') chymoSites.push(`BPP:${bppSeq[i]}${i+1}`);
    }
    const ctermAA = seq[seq.length-1];
    const ctermIsD = !!dAA[seq.length-1];
    const cpRisk = (!ctermIsD && ['K','R','F','Y','W','L'].includes(ctermAA)) ? 'HIGH' : 'LOW';

    let proteaseScore = 0;
    if(dpp4Risk==='HIGH') proteaseScore += 3;
    proteaseScore += Math.min(trypsinSites.length, 4);
    proteaseScore += Math.min(chymoSites.length * 0.5, 3);
    if(cpRisk==='HIGH') proteaseScore += 1;
    proteaseScore -= dAACount * 0.5;
    const nnProtRCount = Object.values(nnAA).filter(id=>NNAA[id]?.protR).length;
    proteaseScore -= nnProtRCount * 0.5; // NNAA protease-resistant residues
    if(cAmide) proteaseScore -= 1;
    const proteaseLevel = proteaseScore <= 1 ? 'GOOD' : proteaseScore <= 4 ? 'MODERATE' : 'POOR';

    // Half-life
    let proteolyticH = 2/60;
    if(dpp4Risk==='LOW') proteolyticH *= 10;
    if(trypsinSites.length === 0) proteolyticH *= 3;
    if(dAACount > 0) proteolyticH *= (1 + dAACount * 2);
    if(nnProtRCount > 0) proteolyticH *= (1 + nnProtRCount * 1.5); // NNAA protease resistance boost
    if(cAmide) proteolyticH *= 2;
    if(hasFa) proteolyticH *= 8;
    if(hasPEGLinker) proteolyticH *= 1.5;

    // Albumin Kd for t1/2
    const firstFaItem = Object.values(atts).flat().find(i=>i?.type==='fa');
    const firstFa = firstFaItem ? FAS.find(f=>f.id===firstFaItem.id) : null;
    const FA_ALBUMIN_KD_uM_local = {'C8':100,'C10':30,'C12':10,'C14':5,'C16':1.0,'C18':0.3,'C18u':0.4,'C18d':0.05,'C20':0.15,'C20d':0.03,'C22':0.08,'C22d':0.02,'C24':0.05,'C24d':0.015};
    const albKD_sc = hasFa && firstFa ? (FA_ALBUMIN_KD_uM_local[firstFa.id] || null) : null;
    let albHalfLifeH = albKD_sc ? 13 * Math.pow(1.0 / albKD_sc, 0.7) : null;
    if(hasFa && albHalfLifeH && cleavLinkId !== 'none') {
      if(cleavLinkId === 'ester') albHalfLifeH *= 0.7;
      else if(cleavLinkId === 'disulfide') albHalfLifeH *= 0.9;
    }

    let renalT1halfH = null;
    if(!hasFa){ renalT1halfH = effectiveMW<1500?0.17:effectiveMW<2500?0.33:effectiveMW<4000?0.75:effectiveMW<6000?1.5:effectiveMW<10000?3.0:6.0; if(hasPEGLinker) renalT1halfH*=2; }
    const effT1halfH = hasFa && albHalfLifeH ? Math.min(proteolyticH, albHalfLifeH) : Math.min(proteolyticH, ...(renalT1halfH?[renalT1halfH]:[]));
    const fmtH = h => h<1?`~${Math.round(h*60)}min`:h<24?`~${h.toFixed(1)}h`:h<168?`~${(h/24).toFixed(1)}d`:`~${(h/168).toFixed(1)}wk`;

    const renalRisk = !hasFa && effectiveMW < 4000 ? 'HIGH' : !hasFa && effectiveMW < 8000 ? 'MODERATE' : 'LOW';

    // Immunogenicity
    let immunoScore = 0;
    if(dAACount > 0) immunoScore -= 2;
    if(cAmide) immunoScore -= 1;
    if(hasPEGLinker) immunoScore -= 1;
    if(bppSeq.length > 0) { immunoScore += 1; if(['dnp2','dnp2d'].includes(bppId)) immunoScore -= 1; if(['tat','rvg29'].includes(bppId)) immunoScore += 1; }
    if(seq.length > 30) immunoScore += 1;
    const immunoLevel = immunoScore <= -1 ? 'LOW' : immunoScore <= 2 ? 'MODERATE' : 'HIGH';

    // Drug-likeness
    const dlScore = [dpp4Risk==='LOW'?2:0, proteaseLevel==='GOOD'?2:proteaseLevel==='MODERATE'?1:0, hasFa?2:0, dAACount>0?1:0, cAmide?1:0, renalRisk==='LOW'?2:renalRisk==='MODERATE'?1:0].reduce((a,b)=>a+b,0);

    return { proteaseScore:proteaseScore.toFixed(1), proteaseLevel, effHalfLife:fmtH(effT1halfH), renalRisk, immunoLevel, dlScore, trypsinCount:trypsinSites.length, chymoCount:chymoSites.length };
  },[seq,atts,dAA,cAmide,bppSeq,bppPos,bppDaa,bppId,totalDaaCount,mw,bppMwCalc,cleavLinkId,nnAAJson]);

  // [Removed: hypothesis-adjusted IC50 and calibration - FAM19A5 specific]

  // Binding-mode specific FA effect on IC50/KD (α-helix vs β-strand vs unknown)
  const bindingModeFAEffect = useMemo(()=>{
    if (!scoreResult?.bindingMode) return null;
    return calcBindingModeFAEffect(atts, seq, scoreResult.bindingMode);
  },[scoreResult, attsJson, seq]);

  const modSummary=useMemo(()=>
    Object.entries(atts).filter(([,ch])=>ch?.length>0).map(([pk,chain])=>({pk,chain,total:chainMW(chain)}))
  ,[atts]);
  const notation=useMemo(()=>{
    if(!seq.length) return '';
    const rc=chain=>chain.map(i=>itemLabel(i)).join('-');
    const parts=[];
    const nt=atts['nterm'];if(nt?.length) parts.push(`[${rc(nt)}]-`);
    [...seq].forEach((aa,i)=>{
      if(i>0) parts.push('-');
      const ch=atts[`r${i}`]??[];const base=dAA[i]?`d${aa}`:aa;
      parts.push(ch.length?`${base}(${rc(ch)})`:base);
    });
    const ct=atts['cterm'];if(ct?.length) parts.push(`-[${rc(ct)}]`);
    if(cAmide) parts.push('-NH₂');
    return parts.join('');
  },[seq,dAA,cAmide,atts]);

  const posLabel=pk=>{
    if(pk==='nterm') return 'N-terminus';if(pk==='cterm') return 'C-terminus';
    const m=pk.match(/^r(\d+)$/);if(m){const i=parseInt(m[1]);return `${seq[i]??''}${i+1}`;}return pk;
  };
  const hasAtt=pk=>(atts[pk]??[]).length>0;
  const updateChain=useCallback((pk,chain)=>setAtts(prev=>({...prev,[pk]:chain})),[]);
  const toggleD=useCallback(i=>setDAA(prev=>({...prev,[i]:!prev[i]})),[]);
  const openEdit=pk=>setEditing(prev=>prev===pk?null:pk);

  // ─── AI CALL: target identification + literature search ONLY ───
  // AI does NOT generate a Kd number — it identifies the target and finds
  // experimentally measured values from published literature.
  const searchLiterature=useCallback(async()=>{
    if(!seq.length||!tgtSeq.length) return;
    setAiLoading(true);setAiResult(null);setAiError(null);

    const modDesc=modSummary.length
      ?modSummary.map(({pk,chain})=>`${posLabel(pk)}: ${chain.map(i=>itemLabel(i)).join('→')}`).join('; ')
      :'unmodified';

    const prompt=`You are an expert in peptide pharmacology with deep knowledge of published binding studies.

CRITICAL RULES — you must follow these exactly:
1. NEVER generate, estimate, extrapolate, or invent a Kd value. Report ONLY values explicitly stated in published peer-reviewed papers.
2. If you are not 100% certain a specific Kd value appears in a specific paper, say "no data found" rather than guessing.
3. Sub-nanomolar (< 1 nM) Kd values for peptide-protein interactions are extremely rare. If you are tempted to report one, triple-check — it is almost certainly AI confabulation. DO NOT report it unless you can cite the exact paper, journal, year, and measured method.
4. Do NOT confuse binding affinities of antibodies or nanobodies with peptides.
5. If the target sequence is unrecognized or the interaction is not in your training data, say so clearly.

QUERY PEPTIDE:
- Sequence: ${seq}  (${seq.length} aa)
- Modifications: ${modDesc}
- C-term: ${cAmide?'amide':'free acid'}
- MW: ${mw.toFixed(0)} Da, pI: ${pI?.toFixed(1)}, charge pH7.4: ${q74.toFixed(1)}, μH: ${muH.toFixed(3)}

TARGET${tgtName?` (user label: "${tgtName}")`:''}:
- Sequence: ${tgtSeq}  (${tgtSeq.length} aa)
- MW: ${tgtProps?.mw.toFixed(0)} Da, pI: ${tgtProps?.pI?.toFixed(1)}, charge pH7.4: ${tgtProps?.q74.toFixed(1)}, GRAVY: ${tgtProps?.gravy?.toFixed(2)}

Respond ONLY with valid JSON, no markdown, no extra text:
{
  "target_recognized": true,
  "target_identity": "full name and UniProt/PDB ID if known, else 'Unknown sequence'",
  "target_description": "brief functional description, or 'Not recognized'",
  "query_peptide_recognized": true,
  "query_peptide_identity": "name if known, else 'Novel / not recognized'",
  "experimental_data": [
    {
      "peptide_name": "exact name of tested peptide",
      "peptide_sequence": "sequence if published",
      "Kd_value": "exact value as reported",
      "method": "SPR / ITC / fluorescence / ELISA / etc",
      "reference": "Author et al Year, Journal Volume:Pages",
      "confidence": "high (directly cited) / medium (closely analogous system) / low (indirect)"
    }
  ],
  "closest_analogue_to_query": "which entry above is most similar to the query peptide, or 'none'",
  "data_confidence": "high / medium / low / none",
  "sar_context": "brief summary of known SAR for this peptide-target class, or 'No published SAR found'",
  "expected_effect_of_modifications": "how do modifications typically affect binding, based on published data only",
  "important_caveats": "list any major limitations or reasons the experimental data may not apply"
}`;

    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1500,
          messages:[{role:"user",content:prompt}]})
      });
      const data=await res.json();
      const text=data.content?.find(b=>b.type==='text')?.text??"";
      try{
        setAiResult(JSON.parse(text.replace(/```json|```/g,'').trim()));
      }catch{setAiError(`Could not parse response: ${text.slice(0,300)}`)}
    }catch(err){setAiError(String(err));}
    setAiLoading(false);
  },[seq,tgtSeq,tgtName,notation,modSummary,mw,pI,q74,muH,tgtProps,cAmide]);

  // ─── STYLES ───
  const S={
    card:{background:'var(--color-background-primary)',border:'0.5px solid var(--color-border-tertiary)',
      borderRadius:'var(--border-radius-lg)',padding:'12px 14px',marginBottom:10},
    lbl:{fontSize:11,color:'var(--color-text-secondary)',textTransform:'uppercase',
      letterSpacing:'0.06em',display:'block',marginBottom:8},
    metric:{background:'var(--color-background-secondary)',borderRadius:'var(--border-radius-md)',padding:'10px 12px'},
  };
  const seqColors=useMemo(()=>effectiveType.map(t=>TYPE_HEX[t].border),[effectiveType]);
  const ResBar=({values,colors,labels,zero,scale})=>{
    const W=Math.max(300,seq.length*15+20),H=82;
    return(
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%'}}>
        <line x1={12} y1={zero} x2={W-4} y2={zero} stroke="var(--color-border-secondary)" strokeWidth={0.5}/>
        {values.map((v,i)=>{
          const bH=Math.abs(v)*scale,up=v>=0;
          return(<g key={i}>
            <rect x={i*15+13} y={up?zero-bH:zero} width={11} height={Math.max(1,bH)} fill={colors[i]} rx={1} opacity={0.85}/>
            <text x={i*15+18} y={H-4} textAnchor="middle" fill={colors[i]} fontSize="8">{labels[i]}</text>
          </g>);
        })}
      </svg>
    );
  };

  const TABS=[{id:'props',label:'⚗ Properties'},{id:'helix',label:'〜 Structure'},{id:'binding',label:'◎ Binding'},{id:'formulation',label:'💊 Formulation'},{id:'pkstab',label:'📊 PK / Stability'},{id:'bbb',label:'🧠 BBB'},{id:'optimize',label:'🔍 Auto'}];
  const TGT_OPTS=[
    {id:'specific',icon:'🎯',label:'Specific target',desc:'Enter sequence + AI literature search'},
    {id:'albumin', icon:'🩸',label:'HSA',desc:'Albumin (lipidation)'},
    {id:'membrane',icon:'🫧',label:'Membrane',desc:'Lipid bilayer'},
  ];

  // ── Tooltip component ────────────────────────────────────────────
  // 물음표에 hover 시 설명 표시. 모든 탭에서 사용.
  const [ttState, setTtState] = useState({show:false, text:'', x:0, y:0});
  const showTt = (e, text) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTtState({ show:true, text, x: r.left + r.width/2, y: r.top });
  };
  const hideTt = () => setTtState(s=>({...s, show:false}));

  const Q = ({tip, style={}}) => (
    <span
      onMouseEnter={e=>showTt(e, tip)}
      onMouseLeave={hideTt}
      style={{
        display:'inline-flex', alignItems:'center', justifyContent:'center',
        width:14, height:14, borderRadius:'50%', fontSize:9, fontWeight:600,
        cursor:'help', flexShrink:0, userSelect:'none',
        background:'var(--color-background-secondary)',
        border:'0.5px solid var(--color-border-secondary)',
        color:'var(--color-text-secondary)',
        ...style,
      }}>?</span>
  );

  const ConfBadge=({level})=>{
    const m={high:['var(--color-background-success)','var(--color-text-success)','var(--color-border-success)'],
      medium:['var(--color-background-warning)','var(--color-text-warning)','var(--color-border-warning)'],
      low:['var(--color-background-danger)','var(--color-text-danger)','var(--color-border-danger)'],
      none:['var(--color-background-secondary)','var(--color-text-secondary)','var(--color-border-secondary)']};
    const [bg,fg,br]=m[level]??m.none;
    return(<span style={{fontSize:10,padding:'2px 8px',borderRadius:999,fontWeight:500,
      background:bg,color:fg,border:`0.5px solid ${br}`}}>{level}</span>);
  };

  return(
    <div style={{display:'flex',height:'100vh',fontFamily:'var(--font-sans)',
      background:'var(--color-background-tertiary)',fontSize:14,overflow:'hidden'}}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}`}</style>

      {/* Tooltip overlay */}
      {ttState.show&&(
        <div style={{
          position:'fixed',
          left: Math.min(ttState.x, window.innerWidth - 300),
          top: ttState.y - 8,
          transform:'translate(-50%, -100%)',
          background:'var(--color-background-primary)',
          border:'0.5px solid var(--color-border-secondary)',
          borderRadius:'var(--border-radius-lg)',
          padding:'10px 14px',
          fontSize:11, lineHeight:1.65,
          color:'var(--color-text-primary)',
          width:280, maxWidth:'90vw',
          zIndex:9999,
          pointerEvents:'none',
          boxShadow:'0 4px 16px rgba(0,0,0,0.12)',
        }}>
          {ttState.text}
        </div>
      )}

      {/* ═══ LEFT PANEL ═══ */}
      <div style={{width:340,minWidth:340,background:'var(--color-background-secondary)',
        borderRight:'0.5px solid var(--color-border-tertiary)',padding:14,overflowY:'auto',
        display:'flex',flexDirection:'column',gap:10}}>

        <div style={{paddingBottom:10,borderBottom:'0.5px solid var(--color-border-tertiary)'}}>
          <div style={{fontSize:15,fontWeight:500,color:'var(--color-text-primary)'}}>🧬 Peptide Designer</div>
          <div style={{fontSize:11,color:'var(--color-text-secondary)',marginTop:2}}>Customize · Compare · Optimize</div>
        </div>

        <div style={S.card}>
          <span style={S.lbl}>Amino acid sequence (1-letter)</span>
          <textarea value={rawSeq} onChange={e=>setRawSeq(e.target.value)}
            placeholder="e.g. HAEGTFTSDVSSYLEGQAAKEFIAWLVKGR"
            style={{width:'100%',boxSizing:'border-box',fontFamily:'var(--font-mono)',fontSize:13,
              resize:'vertical',minHeight:52,padding:'6px 8px',outline:'none',
              background:'var(--color-background-tertiary)',border:'0.5px solid var(--color-border-secondary)',
              borderRadius:'var(--border-radius-md)',color:'var(--color-text-primary)'}}/>
          <div style={{fontSize:11,color:'var(--color-text-secondary)',marginTop:5,display:'flex',justifyContent:'space-between'}}>
            <span>{seq.length} residues</span>
            <span style={{fontFamily:'var(--font-mono)',fontSize:9}}>ACDEFGHIKLMNPQRSTVWY</span>
          </div>
        </div>

        <div style={S.card}>
          <span style={S.lbl}>Global modification</span>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13}}>
            <input type="checkbox" checked={cAmide} onChange={e=>setCAmide(e.target.checked)}
              style={{width:14,height:14,accentColor:'var(--color-text-info)'}}/>
            <span>C-terminal amide</span>
            <code style={{marginLeft:'auto',fontSize:11,color:'var(--color-text-secondary)',
              background:'var(--color-background-tertiary)',padding:'1px 6px',borderRadius:3}}>-CONH₂  −0.98 Da</code>
          </label>
        </div>

        {seq.length>0&&(
          <div style={S.card}>
            <span style={S.lbl}>Residue modifications</span>
            <div style={{fontSize:11,color:'var(--color-text-secondary)',marginBottom:10,lineHeight:1.6}}>
              <b style={{fontWeight:500,color:'var(--color-text-primary)'}}>Click letter</b> = D-form &nbsp;·&nbsp;
              <b style={{fontWeight:500,color:'var(--color-text-primary)'}}>Badge</b> = open chain editor
            </div>
            <div style={{marginBottom:8}}>
              <button onClick={()=>openEdit('nterm')} style={{padding:'4px 10px',fontSize:11,cursor:'pointer',borderRadius:'var(--border-radius-md)',
                background:hasAtt('nterm')?'var(--color-background-info)':'var(--color-background-secondary)',
                border:`0.5px solid ${hasAtt('nterm')?'var(--color-border-info)':'var(--color-border-secondary)'}`,
                color:hasAtt('nterm')?'var(--color-text-info)':'var(--color-text-secondary)'}}>
                {hasAtt('nterm')?`✓ N-term [${(atts['nterm']??[]).length}]`:'+ N-terminus'}
              </button>
            </div>
            {editing==='nterm'&&(<ChainEditor posKey="nterm" label="N-terminus"
              chain={atts['nterm']??[]} onChange={updateChain} onClose={()=>setEditing(null)}/>)}

            <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:8}}>
              {[...seq].map((aa,i)=>{
                const nn=nnAA[i];const nnObj=nn?NNAA[nn]:null;
                const tc=nn?{bg:'#fef3c7',border:'#f59e0b',text:'#92400e'}:TYPE_HEX[AA[aa]?.t??'S'];
                const isD=!!dAA[i],ak=`r${i}`,hA=hasAtt(ak);
                const cnt=(atts[ak]??[]).length;
                return(
                  <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                    <button onClick={()=>nn?null:toggleD(i)}
                      onContextMenu={e=>{e.preventDefault();setNnAAEdit(nnAAEdit===i?null:i);}}
                      title={nn?`${nnObj.n} (pos ${i+1}) — right-click to change`:`${AA[aa]?.n??aa} pos ${i+1} — right-click for non-natural AA`}
                      style={{width:nn?34:26,height:26,border:'none',borderRadius:5,cursor:'pointer',
                        background:isD&&!nn?'transparent':tc.bg,outline:isD&&!nn?`2px solid ${tc.border}`:`1px solid ${tc.border}`,
                        color:isD?tc.border:tc.text,fontSize:nn?8:11,fontWeight:500,
                        display:'flex',alignItems:'center',justifyContent:'center',
                        position:'relative',lineHeight:1,fontFamily:'var(--font-mono)'}}>
                      {nn?nnObj.lab:aa}
                      {isD&&!nn&&<span style={{position:'absolute',bottom:1,right:1,fontSize:6,fontWeight:700}}>D</span>}
                      {nn&&<span style={{position:'absolute',top:0,right:1,fontSize:5,fontWeight:700,color:'#f59e0b'}}>✦</span>}
                    </button>
                    {nnAAEdit===i&&(
                      <div style={{position:'absolute',zIndex:100,marginTop:30,background:'var(--color-background-primary)',
                        border:'1px solid var(--color-border-secondary)',borderRadius:6,padding:6,boxShadow:'0 4px 12px rgba(0,0,0,0.15)',
                        maxHeight:200,overflowY:'auto',width:180}}>
                        <div style={{fontSize:9,color:'var(--color-text-secondary)',marginBottom:4}}>Non-natural AA for {aa}{i+1}</div>
                        <button onClick={()=>{setNnAA(p=>{const n={...p};delete n[i];return n;});setNnAAEdit(null);}}
                          style={{width:'100%',textAlign:'left',padding:'3px 6px',fontSize:10,cursor:'pointer',marginBottom:2,
                            background:!nn?'var(--color-background-info)':'transparent',border:'none',borderRadius:3,
                            color:!nn?'var(--color-text-info)':'var(--color-text-primary)'}}>
                          ↩ Standard ({aa} - {AA[aa]?.n})
                        </button>
                        {Object.entries(NNAA).map(([id,obj])=>(
                          <button key={id} onClick={()=>{setNnAA(p=>({...p,[i]:id}));setNnAAEdit(null);}}
                            style={{width:'100%',textAlign:'left',padding:'3px 6px',fontSize:10,cursor:'pointer',marginBottom:1,
                              background:nn===id?'#fef3c7':'transparent',border:'none',borderRadius:3,
                              color:'var(--color-text-primary)'}}>
                            <b>{obj.lab}</b> <span style={{color:'var(--color-text-secondary)',fontSize:9}}>({obj.n}) {obj.replaces?`→${obj.replaces}`:''}  {obj.protR?'🛡':''}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <button onClick={()=>openEdit(ak)} style={{width:nn?34:26,height:14,padding:0,border:'none',
                      cursor:'pointer',borderRadius:3,fontSize:hA?9:8,lineHeight:1,fontWeight:hA?500:400,
                      background:hA?'var(--color-background-info)':'var(--color-background-tertiary)',
                      color:hA?'var(--color-text-info)':'var(--color-text-secondary)',
                      outline:`0.5px solid ${hA?'var(--color-border-info)':'var(--color-border-tertiary)'}`}}>
                      {hA?cnt:'⬡'}
                    </button>
                  </div>
                );
              })}
            </div>
            {Object.keys(nnAA).length>0&&(
              <div style={{fontSize:10,color:'#92400e',marginBottom:8,padding:'4px 8px',background:'#fef3c7',borderRadius:4}}>
                ✦ Non-natural AA: {Object.entries(nnAA).map(([i,id])=>`${seq[i]}${parseInt(i)+1}→${NNAA[id]?.lab}`).join(', ')}
                <button onClick={()=>setNnAA({})} style={{marginLeft:8,fontSize:9,cursor:'pointer',background:'none',border:'1px solid #f59e0b',borderRadius:3,color:'#92400e',padding:'1px 5px'}}>전체 초기화</button>
              </div>
            )}
            {[...seq].map((aa,i)=>{
              const ak=`r${i}`;
              return editing===ak?(<ChainEditor key={ak} posKey={ak} label={`${aa}${i+1}`}
                chain={atts[ak]??[]} onChange={updateChain} onClose={()=>setEditing(null)}/>):null;
            })}

            <button onClick={()=>openEdit('cterm')} style={{padding:'4px 10px',fontSize:11,cursor:'pointer',borderRadius:'var(--border-radius-md)',
              background:hasAtt('cterm')?'var(--color-background-info)':'var(--color-background-secondary)',
              border:`0.5px solid ${hasAtt('cterm')?'var(--color-border-info)':'var(--color-border-secondary)'}`,
              color:hasAtt('cterm')?'var(--color-text-info)':'var(--color-text-secondary)'}}>
              {hasAtt('cterm')?`✓ C-term [${(atts['cterm']??[]).length}]`:'+ C-terminus'}
            </button>
            {editing==='cterm'&&(<ChainEditor posKey="cterm" label="C-terminus"
              chain={atts['cterm']??[]} onChange={updateChain} onClose={()=>setEditing(null)}/>)}
          </div>
        )}

        {notation&&(<div style={{...S.card,background:'var(--color-background-secondary)'}}>
          <span style={S.lbl}>Modified notation</span>
          <div style={{fontSize:11,fontFamily:'var(--font-mono)',color:'var(--color-text-primary)',
            wordBreak:'break-all',lineHeight:1.8}}>{notation}</div>
        </div>)}

        <div style={{...S.card,padding:'10px 14px'}}>
          <span style={S.lbl}>Legend</span>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {Object.entries(TYPE_LABEL).map(([t,lab])=>(
              <div key={t} style={{display:'flex',alignItems:'center',gap:5,fontSize:10,color:'var(--color-text-secondary)'}}>
                <div style={{width:8,height:8,borderRadius:2,background:TYPE_HEX[t].border}}></div>{lab}
              </div>
            ))}
          </div>
          <div style={{fontSize:10,color:'var(--color-text-secondary)',marginTop:5}}>
            Outlined = D-form · Badge number = # items in chain
          </div>
        </div>

        {/* ═══ BPP (BBB Shuttle Peptide) PANEL ═══ */}
        <div style={{padding:'8px 14px',marginTop:8,background:'var(--color-background-secondary)',borderRadius:'var(--border-radius-md)',borderLeft:'3px solid #8b5cf6'}}>
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:bppSeq?8:0,flexWrap:'wrap'}}>
            <span style={{fontSize:11,fontWeight:600,color:'#8b5cf6',whiteSpace:'nowrap'}}>🧠 BPP</span>
            <select value={bppId} onChange={e=>{setBppId(e.target.value);setBppDaa({});setBppRetroInverso(false);}}
              style={{fontSize:11,padding:'3px 6px',borderRadius:4,border:'1px solid var(--color-border-secondary)',
                background:'var(--color-background-primary)',color:'var(--color-text-primary)',flex:1,minWidth:0}}>
              {BPPS.map(b=><option key={b.id} value={b.id}>{b.lab}{b.rating?` ${'★'.repeat(b.rating)}`:''}</option>)}
            </select>
            {bppSeq&&(
              <select value={bppPos} onChange={e=>setBppPos(e.target.value)}
                style={{fontSize:11,padding:'3px 6px',borderRadius:4,border:'1px solid var(--color-border-secondary)',
                  background:'var(--color-background-primary)',color:'var(--color-text-primary)'}}>
                <option value="cterm">C-term</option>
                <option value="nterm">N-term</option>
                {lysPositions.map(lp=><option key={`r${lp.idx}`} value={`r${lp.idx}`}>Branch: {lp.label}</option>)}
              </select>
            )}
          </div>
          {bppId==='custom'&&(
            <input value={bppCustomSeq} onChange={e=>setBppCustomSeq(e.target.value)}
              placeholder="BPP sequence (1-letter)" style={{width:'100%',fontSize:11,padding:'4px 6px',
                marginBottom:6,borderRadius:4,border:'1px solid var(--color-border-secondary)',
                background:'var(--color-background-primary)',color:'var(--color-text-primary)',fontFamily:'var(--font-mono)'}}/>
          )}
          {bppSeq&&(
            <>
              <div style={{display:'flex',gap:6,marginBottom:6,alignItems:'center',flexWrap:'wrap'}}>
                <button onClick={()=>{
                  setBppRetroInverso(p=>!p);
                  // Auto-set all D-form when turning ON retro-inverso
                  if(!bppRetroInverso){
                    const allD={};for(let i=0;i<bppSeq.length;i++) allD[i]=true;
                    setBppDaa(allD);
                  } else { setBppDaa({}); }
                }}
                  style={{fontSize:10,padding:'3px 10px',borderRadius:4,cursor:'pointer',fontWeight:600,
                    border:bppRetroInverso?'2px solid #8b5cf6':'1px solid var(--color-border-secondary)',
                    background:bppRetroInverso?'#f3e8ff':'var(--color-background-primary)',
                    color:bppRetroInverso?'#7c3aed':'var(--color-text-secondary)'}}>
                  {bppRetroInverso?'✓ Retro-inverso ON':'Retro-inverso'}
                </button>
                <button onClick={()=>{const allD={};for(let i=0;i<bppSeq.length;i++) allD[i]=true;setBppDaa(allD);}}
                  style={{fontSize:10,padding:'3px 8px',borderRadius:4,cursor:'pointer',
                    border:'1px solid var(--color-border-secondary)',background:'var(--color-background-primary)',
                    color:'var(--color-text-secondary)'}}>All D</button>
                <button onClick={()=>setBppDaa({})}
                  style={{fontSize:10,padding:'3px 8px',borderRadius:4,cursor:'pointer',
                    border:'1px solid var(--color-border-secondary)',background:'var(--color-background-primary)',
                    color:'var(--color-text-secondary)'}}>All L</button>
                <span style={{fontSize:10,color:'var(--color-text-secondary)'}}>
                  {bppSeq.length} aa · D-AA {bppNdaa}/{bppSeq.length}
                  {bppRetroInverso&&<span style={{color:'#7c3aed'}}> · Reversed</span>}
                </span>
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:3}}>
                {[...bppSeq].map((aa,i)=>{
                  const tc=TYPE_HEX[AA[aa]?.t??'S']||{bg:'#eee',border:'#999',text:'#333'};const isD=!!bppDaa[i];
                  return(<button key={i} onClick={()=>setBppDaa(p=>({...p,[i]:!p[i]}))}
                    style={{width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',
                      fontSize:11,fontWeight:500,borderRadius:4,cursor:'pointer',position:'relative',
                      background:isD?'transparent':tc.bg,
                      outline:isD?`2px solid ${tc.border}`:`1px solid ${tc.border}`,
                      color:isD?tc.border:tc.text,border:'none'}}>
                    {aa}{isD&&<span style={{position:'absolute',bottom:1,right:1,fontSize:6,fontWeight:700}}>D</span>}
                  </button>);
                })}
              </div>
              <div style={{display:'flex',gap:8,marginTop:6,fontSize:10,alignItems:'center'}}>
                <span style={{color:'var(--color-text-secondary)',whiteSpace:'nowrap'}}>Peptide↔BPP bond:</span>
                <select value={bppBondType} onChange={e=>setBppBondType(e.target.value)}
                  style={{fontSize:10,padding:'2px 4px',borderRadius:3,border:'1px solid var(--color-border-secondary)',
                    background:'var(--color-background-primary)',color:'var(--color-text-primary)',flex:1}}>
                  <option value="stable">Stable (non-cleavable)</option>
                  {CLEAVABLE_LINKERS.map(c=><option key={c.id} value={c.id}>✂ {c.lab} (pH {c.cleavagePH})</option>)}
                </select>
              </div>
              {bppBondType!=='stable'&&(
                <div style={{fontSize:9,color:'#7c3aed',marginTop:3}}>
                  ✂ Peptide↔BPP 사이 {CLEAVABLE_LINKERS.find(c=>c.id===bppBondType)?.lab||''} 절단 시 BPP가 분리됨
                </div>
              )}
              <div style={{display:'flex',gap:8,marginTop:4,fontSize:10,alignItems:'center'}}>
                {detectedCleavable&&<span style={{color:'#7c3aed'}}>✂ FA chain에도: {detectedCleavable.lab}</span>}
              </div>
              {bppObj.keyResidueWarning&&!bppRetroInverso&&<div style={{fontSize:10,color:'var(--color-text-warning)',marginTop:4}}>⚠ {bppObj.keyResidueWarning}</div>}
              {bppRetroInverso&&<div style={{fontSize:10,color:'#7c3aed',marginTop:4}}>
                ✓ Retro-inverso: 역순 서열 + D-form → side chain 방향 보존, protease 완전 저항
                {bppObj.id==='ang2'&&' · LRP-1 결합 유지 기대 (실험 검증 필요)'}
              </div>}
              {bppIsLysBranch&&<div style={{fontSize:10,color:'var(--color-text-info)',marginTop:4}}>
                📌 Branch at {seq[parseInt(bppPos.slice(1))]}{parseInt(bppPos.slice(1))+1} side chain
                {atts[bppPos]?.length>0&&<span style={{color:'var(--color-text-danger)'}}> ⚠ 이 위치에 이미 FA/Linker 있음 — 충돌 주의!</span>}
              </div>}
            </>
          )}
          {!bppSeq&&bppId==='none'&&(
            <div style={{fontSize:10,color:'var(--color-text-secondary)'}}>BBB shuttle 선택 시 서열 추가 + 잔기별 D-form 전환 가능</div>
          )}
        </div>
      </div>

      {/* ═══ RIGHT PANEL ═══ */}
      <div style={{flex:1,padding:16,overflowY:'auto'}}>
        {!seq.length?(
          <div style={{textAlign:'center',paddingTop:80,color:'var(--color-text-secondary)'}}>
            <div style={{fontSize:48,marginBottom:16}}>🧬</div>
            <div style={{fontSize:18,fontWeight:500,color:'var(--color-text-primary)'}}>Enter a peptide sequence</div>
            <div style={{fontSize:12,marginTop:8}}>Example: HAEGTFTSDVSSYLEGQAAKEFIAWLVKGR (GLP-1 7–36)</div>
          </div>
        ):(
          <>
            {/* ═══ COMPARE LOG (always visible) ═══ */}
            {pinnedConfigs.length > 0 && (
              <div style={{marginBottom:10,border:'0.5px solid var(--color-border-secondary)',
                borderRadius:'var(--border-radius-lg)',overflow:'hidden',
                background:'var(--color-background-primary)'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
                  padding:'6px 12px',background:'var(--color-background-secondary)',
                  borderBottom:'0.5px solid var(--color-border-tertiary)'}}>
                  <span style={{fontSize:12,fontWeight:600,color:'var(--color-text-primary)'}}>
                    📊 Variant Comparison ({pinnedConfigs.length} pinned)
                  </span>
                  <button onClick={()=>{if(confirm('모든 핀을 삭제하시겠습니까?'))setPinnedConfigs([]);}}
                    style={{fontSize:10,padding:'2px 8px',cursor:'pointer',background:'none',
                      border:'1px solid var(--color-border-danger)',borderRadius:4,
                      color:'var(--color-text-danger)'}}>전체 삭제</button>
                </div>
                <div style={{overflowX:'auto',maxHeight:220,overflowY:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:10,whiteSpace:'nowrap'}}>
                    <thead>
                      <tr style={{borderBottom:'1.5px solid var(--color-border-secondary)',
                        background:'var(--color-background-tertiary)'}}>
                        {['','Label','Modification','MW','Alb.Kd','T½','Protease','Route','BBB','DL',''].map((h,i)=>(
                          <th key={i} style={{padding:'5px 6px',fontWeight:500,textAlign:i<2?'left':'center',
                            color:'var(--color-text-secondary)',position:'sticky',top:0,
                            background:'var(--color-background-tertiary)',zIndex:1}}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pinnedConfigs.map((c,i)=>{
                        const isBest = (key, dir) => {
                          if(pinnedConfigs.length < 2) return false;
                          const vals = pinnedConfigs.map(p=>p[key]).filter(v=>v!=null&&v!=='—'&&!isNaN(parseFloat(v)));
                          if(vals.length<2) return false;
                          const num = parseFloat(c[key]);
                          if(isNaN(num)) return false;
                          return dir==='min' ? num<=Math.min(...vals.map(Number)) : num>=Math.max(...vals.map(Number));
                        };
                        const albKdStr = c.albKd ? (c.albKd<1?`${(c.albKd*1000).toFixed(0)}pM`:`${c.albKd.toFixed(0)}nM`) : '—';
                        const routeStr = c.effHalfLife?.includes('d')||c.effHalfLife?.includes('wk')?'SC ✓':c.effHalfLife?.includes('h')?'IV':'IV(짧음)';
                        const bbbColors = {HIGH:'var(--color-text-success)',MODERATE:'var(--color-text-warning)',LOW:'var(--color-text-danger)',NONE:'var(--color-text-secondary)'};
                        const protColors = {GOOD:'var(--color-text-success)',MODERATE:'var(--color-text-warning)',POOR:'var(--color-text-danger)'};
                        return(
                          <tr key={c.id||i} style={{borderBottom:'0.5px solid var(--color-border-tertiary)',
                            background:i%2===0?'var(--color-background-primary)':'var(--color-background-secondary)'}}>
                            <td style={{padding:'4px 6px',color:'var(--color-text-secondary)',fontWeight:600}}>📌{i+1}</td>
                            <td style={{padding:'4px 6px',fontWeight:500,color:'var(--color-text-primary)',maxWidth:80,overflow:'hidden',textOverflow:'ellipsis'}}>{c.label}</td>
                            <td style={{padding:'4px 6px',color:'var(--color-text-secondary)',maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',fontSize:9}}>{c.modSummary||'—'}</td>
                            <td style={{padding:'4px 6px',textAlign:'center',fontFamily:'var(--font-mono)',
                              fontWeight:isBest('totalMw','min')?700:400,
                              color:isBest('totalMw','min')?'var(--color-text-success)':'var(--color-text-primary)'}}>
                              {c.totalMw?.toFixed(0)||'—'}
                            </td>
                            <td style={{padding:'4px 6px',textAlign:'center',fontFamily:'var(--font-mono)',
                              fontWeight:isBest('albKd','min')?700:400,
                              color:isBest('albKd','min')?'var(--color-text-success)':'var(--color-text-primary)'}}>
                              {albKdStr}
                            </td>
                            <td style={{padding:'4px 6px',textAlign:'center',fontFamily:'var(--font-mono)',color:'var(--color-text-primary)'}}>{c.effHalfLife||'—'}</td>
                            <td style={{padding:'4px 6px',textAlign:'center',
                              color:protColors[c.proteaseLevel]||'var(--color-text-secondary)'}}>{c.proteaseLevel||'—'}</td>
                            <td style={{padding:'4px 6px',textAlign:'center',color:'var(--color-text-primary)'}}>{routeStr}</td>
                            <td style={{padding:'4px 6px',textAlign:'center',
                              color:bbbColors[c.bbbLevel]||'var(--color-text-secondary)'}}>{c.bbbLevel||'—'}</td>
                            <td style={{padding:'4px 6px',textAlign:'center',fontFamily:'var(--font-mono)',
                              fontWeight:isBest('dlScore','max')?700:400,
                              color:isBest('dlScore','max')?'var(--color-text-success)':'var(--color-text-primary)'}}>
                              {c.dlScore||0}/10
                            </td>
                            <td style={{padding:'4px 3px'}}>
                              <button onClick={()=>setPinnedConfigs(p=>p.filter((_,j)=>j!==i))}
                                style={{fontSize:9,cursor:'pointer',background:'none',border:'none',
                                  color:'var(--color-text-danger)',padding:2}}>✕</button>
                            </td>
                          </tr>
                        );
                      })}
                      {/* ✏️ Current row - always last */}
                      <tr style={{borderTop:'2px solid var(--color-border-info)',
                        background:'var(--color-background-info)'}}>
                        <td style={{padding:'4px 6px',color:'var(--color-text-info)',fontWeight:700}}>✏️</td>
                        <td style={{padding:'4px 6px',fontWeight:600,color:'var(--color-text-info)'}}>Current</td>
                        <td style={{padding:'4px 6px',color:'var(--color-text-secondary)',fontSize:9,maxWidth:140,overflow:'hidden',textOverflow:'ellipsis'}}>
                          {(()=>{
                            const fi=Object.values(atts).flat().find(i=>i?.type==='fa');
                            const fa=fi?FAS.find(f=>f.id===fi.id)?.lab:'—';
                            return `${fa} · D×${nDAA}${nnAACount?` · NNAA×${nnAACount}`:''}`;
                          })()}
                        </td>
                        <td style={{padding:'4px 6px',textAlign:'center',fontFamily:'var(--font-mono)',fontWeight:600,color:'var(--color-text-info)'}}>{totalMw.toFixed(0)}</td>
                        <td style={{padding:'4px 6px',textAlign:'center',fontFamily:'var(--font-mono)',fontWeight:600,color:'var(--color-text-info)'}}>
                          {kdEst?.best ? (kdEst.best<1?`${(kdEst.best*1000).toFixed(0)}pM`:`${kdEst.best.toFixed(0)}nM`) : '—'}
                        </td>
                        <td style={{padding:'4px 6px',textAlign:'center',fontFamily:'var(--font-mono)',fontWeight:600,color:'var(--color-text-info)'}}>{pkCalc?.effHalfLife||'—'}</td>
                        <td style={{padding:'4px 6px',textAlign:'center',fontWeight:600,color:'var(--color-text-info)'}}>{pkCalc?.proteaseLevel||'—'}</td>
                        <td style={{padding:'4px 6px',textAlign:'center',fontWeight:600,color:'var(--color-text-info)'}}>
                          {pkCalc?.effHalfLife?.includes('d')||pkCalc?.effHalfLife?.includes('wk')?'SC ✓':pkCalc?.effHalfLife?.includes('h')?'IV':'—'}
                        </td>
                        <td style={{padding:'4px 6px',textAlign:'center',fontWeight:600,color:'var(--color-text-info)'}}>
                          {bppSeq.length>0?(bppObj.rating>=4?'HIGH':bppObj.rating>=2?'MOD':'LOW'):'NONE'}
                        </td>
                        <td style={{padding:'4px 6px',textAlign:'center',fontFamily:'var(--font-mono)',fontWeight:600,color:'var(--color-text-info)'}}>{pkCalc?.dlScore||0}/10</td>
                        <td style={{padding:'4px 3px'}}>
                          <button onClick={()=>{
                            const fi=Object.values(atts).flat().find(i=>i?.type==='fa');
                            const faLab=fi?FAS.find(f=>f.id===fi.id)?.lab||fi.id:'None';
                            const modSum=`${faLab} · D×${nDAA}${nnAACount?` · NNAA×${nnAACount}`:''}`;
                            setPinnedConfigs(p=>[...p, {
                              id: Date.now(),
                              label: `Pin ${String.fromCharCode(65+p.length)}`,
                              modSummary: modSum,
                              seq, notation, nDAA, nnAACount,
                              totalMw, totalPi, totalQ74, totalGravy,
                              albKd: kdEst?.best||null,
                              effHalfLife: pkCalc?.effHalfLife||'—',
                              proteaseLevel: pkCalc?.proteaseLevel||'—',
                              proteaseScore: pkCalc?.proteaseScore||'—',
                              renalRisk: pkCalc?.renalRisk||'—',
                              immunoLevel: pkCalc?.immunoLevel||'—',
                              dlScore: pkCalc?.dlScore||0,
                              bbbLevel: bppSeq.length>0?(bppObj.rating>=4?'HIGH':bppObj.rating>=2?'MODERATE':'LOW'):'NONE',
                              faLabel: faLab,
                              bppLabel: bppSeq.length>0?bppObj.lab:'None',
                            }]);
                          }}
                            style={{fontSize:9,cursor:'pointer',background:'var(--color-background-info)',
                              border:'1px solid var(--color-border-info)',borderRadius:3,
                              color:'var(--color-text-info)',padding:'1px 5px',fontWeight:700}}>📌</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pin button when no pins yet */}
            {pinnedConfigs.length === 0 && (
              <div style={{marginBottom:8,display:'flex',justifyContent:'flex-end'}}>
                <button onClick={()=>{
                  const fi=Object.values(atts).flat().find(i=>i?.type==='fa');
                  const faLab=fi?FAS.find(f=>f.id===fi.id)?.lab||fi.id:'None';
                  const modSum=`${faLab} · D×${nDAA}${nnAACount?` · NNAA×${nnAACount}`:''}`;
                  setPinnedConfigs([{
                    id: Date.now(),
                    label: 'Pin A',
                    modSummary: modSum,
                    seq, notation, nDAA, nnAACount,
                    totalMw, totalPi, totalQ74, totalGravy,
                    albKd: kdEst?.best||null,
                    effHalfLife: pkCalc?.effHalfLife||'—',
                    proteaseLevel: pkCalc?.proteaseLevel||'—',
                    proteaseScore: pkCalc?.proteaseScore||'—',
                    renalRisk: pkCalc?.renalRisk||'—',
                    immunoLevel: pkCalc?.immunoLevel||'—',
                    dlScore: pkCalc?.dlScore||0,
                    bbbLevel: bppSeq.length>0?(bppObj.rating>=4?'HIGH':bppObj.rating>=2?'MODERATE':'LOW'):'NONE',
                    faLabel: faLab,
                    bppLabel: bppSeq.length>0?bppObj.lab:'None',
                  }]);
                }}
                  style={{padding:'6px 14px',fontSize:11,cursor:'pointer',
                    background:'var(--color-background-info)',border:'1px solid var(--color-border-info)',
                    borderRadius:'var(--border-radius-md)',color:'var(--color-text-info)',fontWeight:600}}>
                  📌 Pin current config to start comparing
                </button>
              </div>
            )}

            {/* ═══ TAB BAR ═══ */}
            <div style={{display:'flex',gap:2,marginBottom:8,borderBottom:'0.5px solid var(--color-border-tertiary)',flexWrap:'wrap'}}>
              {TABS.map(t=>(
                <button key={t.id} onClick={()=>setTab(t.id)} style={{
                  padding:'8px 12px',fontSize:12,cursor:'pointer',
                  background:tab===t.id?'var(--color-background-primary)':'transparent',border:'none',
                  borderBottom:`2px solid ${tab===t.id?'var(--color-text-info)':'transparent'}`,
                  color:tab===t.id?'var(--color-text-primary)':'var(--color-text-secondary)',
                  fontWeight:tab===t.id?500:400,borderRadius:'var(--border-radius-md) var(--border-radius-md) 0 0'}}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── PROPERTIES ── */}
            {tab==='props'&&(
              <div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10,marginBottom:14}}>
                  {[
                    {l:'Molecular weight', v:`${totalMw.toFixed(2)}`, u:'Da', s:bppSeq.length?`Core ${mw.toFixed(0)} + BPP ${bppMwCalc.toFixed(0)}`:`Mono ≈ ${(mw-1).toFixed(2)} Da`,
                     tip:'평균 분자량 (modification + BPP 포함)\n\n<5 kDa: 신장 필터링 위험\n5-15 kDa: SC 흡수에 최적\n>50 kDa: 신장 필터링 거의 없음'},
                    {l:'Isoelectric point', v:totalPi?totalPi.toFixed(2):'—', u:'pI', s:bppSeq.length?`Core pI: ${pI?.toFixed(2)||'—'}`:'Henderson-Hasselbalch',
                     tip:'등전점 — 전하가 0이 되는 pH\n\npI 근처 pH에서 용해도 최저 → aggregation 위험\nFormulation pH는 pI에서 ±2 이상 차이 권장\n\nBPP가 있으면 전체 서열 기반으로 재계산됨'},
                    {l:'Charge @ pH 7.4', v:totalQ74.toFixed(2), u:'e', s:totalQ74>0.1?'Cationic':totalQ74<-0.1?'Anionic':'Neutral',
                     tip:'생리 pH 7.4에서의 순 전하 (BPP 포함)\n\n양전하(+): BBB 흡착 transcytosis에 유리\n음전하(-): 혈중 안정성에 유리\n|전하| > 4: SC 흡수율 감소 위험'},
                    {l:'GRAVY score', v:totalGravy!==null?totalGravy.toFixed(3):'—', u:'', s:bppSeq.length?`Core: ${gravy?.toFixed(3)||'—'}`:(totalGravy!==null?(totalGravy>0?'Hydrophobic':'Hydrophilic'):''),
                     tip:'Grand Average of hYdropathicity\nKyte-Doolittle scale 기반\n\n> 0: 소수성 → aggregation 위험, 막 삽입 가능\n< 0: 친수성 → 수용성 좋음\n< -0.5: 매우 친수성, FA 없이도 용해도 충분\n\n소수성 FA 수식 시 전체 GRAVY 상승'},
                    {l:'Length', v:seq.length+(bppSeq.length?` +${bppSeq.length} BPP`:''), u:'aa', s:`${nDAA}+${bppNdaa} D-res${nnAACount?` · ${nnAACount} NNAA`:''}`,
                     tip:'서열 길이 (아미노산 수)\n\n< 10 aa: 신장 청소 빠름, FA 없이 반감기 매우 짧음\n10-30 aa: 치료 펩타이드 전형적 범위\n> 30 aa: SC 흡수율 저하 가능'},
                    {l:'C-terminus', v:cAmide?'–NH₂':'–COOH', u:'', s:cAmide?'Amidated':'Free carboxyl',
                     tip:'C-terminal 변형\n\n–NH₂ (amide): carboxypeptidase 완전 보호 → 안정성 대폭 향상. 다수 승인 약물 사용\n–COOH (free): carboxypeptidase에 취약'},
                  ].map(({l,v,u,s,tip})=>(
                    <div key={l} style={S.metric}>
                      <div style={{fontSize:11,color:'var(--color-text-secondary)',marginBottom:4,display:'flex',alignItems:'center',gap:4}}>
                        {l} <Q tip={tip}/>
                      </div>
                      <div style={{display:'flex',alignItems:'baseline',gap:4}}>
                        <span style={{fontSize:22,fontWeight:500,color:'var(--color-text-primary)',fontFamily:'var(--font-mono)'}}>{v}</span>
                        {u&&<span style={{fontSize:12,color:'var(--color-text-secondary)'}}>{u}</span>}
                      </div>
                      {s&&<div style={{fontSize:10,color:'var(--color-text-secondary)',marginTop:3}}>{s}</div>}
                    </div>
                  ))}
                </div>
                <div style={S.card}>
                  <span style={S.lbl}>Charge vs pH profile</span>
                  <svg viewBox="0 0 520 130" style={{width:'100%'}}>
                    {[0,2,4,6,8,10,12,14].map(ph=>(
                      <line key={ph} x1={ph/14*480+20} y1={8} x2={ph/14*480+20} y2={105}
                        stroke="var(--color-border-tertiary)" strokeWidth={0.5}/>
                    ))}
                    <line x1={20} y1={56} x2={500} y2={56} stroke="var(--color-border-secondary)" strokeWidth={0.5}/>
                    {pI&&pI>=0&&pI<=14&&(<>
                      <line x1={pI/14*480+20} y1={8} x2={pI/14*480+20} y2={105}
                        stroke="var(--color-text-info)" strokeWidth={1} strokeDasharray="3,2" opacity={0.7}/>
                      <text x={pI/14*480+22} y={20} fill="var(--color-text-info)" fontSize="9">pI={pI.toFixed(1)}</text>
                    </>)}
                    <line x1={7.4/14*480+20} y1={8} x2={7.4/14*480+20} y2={105}
                      stroke="var(--color-text-warning)" strokeWidth={1} strokeDasharray="2,3" opacity={0.7}/>
                    <text x={7.4/14*480+22} y={34} fill="var(--color-text-warning)" fontSize="9">pH 7.4</text>
                    <polyline points={chargePr.map(({ph,q})=>`${ph/14*480+20},${56-q*14}`).join(' ')}
                      fill="none" stroke="var(--color-text-info)" strokeWidth={1.5}/>
                    {[0,2,4,6,8,10,12,14].map(ph=>(
                      <text key={ph} x={ph/14*480+20} y={120} textAnchor="middle"
                        fill="var(--color-text-secondary)" fontSize="8">{ph}</text>
                    ))}
                    <text x={498} y={122} fill="var(--color-text-secondary)" fontSize="9">pH</text>
                    <text x={10} y={14} fill="var(--color-text-secondary)" fontSize="8">+</text>
                    <text x={10} y={100} fill="var(--color-text-secondary)" fontSize="8">−</text>
                  </svg>
                </div>
                {modSummary.length>0&&(
                  <div style={S.card}>
                    <span style={S.lbl}>Modification chains</span>
                    {modSummary.map(({pk,chain,total})=>(
                      <div key={pk} style={{marginBottom:12,paddingBottom:12,borderBottom:'0.5px solid var(--color-border-tertiary)'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                          <span style={{fontSize:12,fontWeight:500,color:'var(--color-text-info)',fontFamily:'var(--font-mono)'}}>{posLabel(pk)}</span>
                          <span style={{fontSize:11,color:'var(--color-text-success)',fontFamily:'var(--font-mono)'}}>+{total.toFixed(2)} Da</span>
                        </div>
                        <div style={{display:'flex',flexWrap:'wrap',gap:4,alignItems:'center'}}>
                          <span style={{fontSize:11,color:'var(--color-text-secondary)'}}>NH₂</span>
                          {chain.map((item,idx)=>{
                            const isL=item.type==='linker';
                            return(<Fragment key={idx}>
                              <span style={{fontSize:10,color:'var(--color-text-secondary)'}}>→</span>
                              <span style={{fontSize:11,padding:'2px 8px',borderRadius:999,fontFamily:'var(--font-mono)',
                                background:isL?'var(--color-background-info)':'#FAEEDA',
                                color:isL?'var(--color-text-info)':'#633806',
                                border:`0.5px solid ${isL?'var(--color-border-info)':'#BA7517'}`}}>
                                {itemLabel(item)}<span style={{opacity:0.6,fontSize:9,marginLeft:4}}>+{itemMW(item).toFixed(1)}</span>
                              </span>
                            </Fragment>);
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── HELIX ── */}
            {tab==='helix'&&(
              <div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
                  <div style={S.metric}>
                    <div style={{fontSize:11,color:'var(--color-text-secondary)',marginBottom:4}}>Hydrophobic moment (μH)</div>
                    <div style={{fontSize:22,fontWeight:500,color:'var(--color-text-primary)',fontFamily:'var(--font-mono)'}}>{muH.toFixed(3)}</div>
                    <div style={{margin:'8px 0 4px',background:'var(--color-background-tertiary)',borderRadius:4,height:4,overflow:'hidden'}}>
                      <div style={{width:`${Math.min(100,muH/0.7*100)}%`,height:'100%',background:'var(--color-text-info)'}}></div>
                    </div>
                    <div style={{fontSize:11,color:'var(--color-text-secondary)'}}>
                      {muH<0.2?'Weak amphipathicity':muH<0.4?'Moderate':muH<0.6?'Strong — good membrane activity':'Very strong'}
                    </div>
                    {/* FA / D-AA effect note */}
                    {(hasFA||Object.values(dAA).some(Boolean))&&(
                      <div style={{marginTop:6,fontSize:10,color:'var(--color-text-warning)',lineHeight:1.5}}>
                        {hasFA&&'FA 수식 반영됨: 소수성 기여 증가'}
                        {hasFA&&Object.values(dAA).some(Boolean)&&' · '}
                        {Object.values(dAA).some(Boolean)&&'D-AA 반영됨: 180° 반전'}
                      </div>
                    )}
                  </div>
                  <div style={S.metric}>
                    <div style={{fontSize:11,color:'var(--color-text-secondary)',marginBottom:4}}>Mean helix propensity (Chou-Fasman)</div>
                    <div style={{fontSize:22,fontWeight:500,color:'var(--color-text-primary)',fontFamily:'var(--font-mono)'}}>{avgHP.toFixed(3)}</div>
                    <div style={{margin:'8px 0 4px',background:'var(--color-background-tertiary)',borderRadius:4,height:4,overflow:'hidden'}}>
                      <div style={{width:`${Math.min(100,(avgHP-0.5)/0.8*100)}%`,height:'100%',background:'var(--color-text-success)'}}></div>
                    </div>
                    <div style={{fontSize:11,color:'var(--color-text-secondary)'}}>
                      {avgHP>1.1?'High α-helix tendency':avgHP>0.9?'Moderate':' Low — breakers present'}
                    </div>
                  </div>
                </div>

                {/* Modified helix propensity — binding mode aware */}
                {(hasFA||modSummary.length>0)&&(()=>{
                  const bm = scoreResult?.bindingMode;
                  const isBeta = bm?.mode === 'beta_strand';
                  const isHelix = bm?.mode === 'helix';
                  return (
                    <div style={{...S.card,
                      border:`0.5px solid ${isBeta?'var(--color-border-secondary)':helixMod.delta>0?'var(--color-border-success)':helixMod.delta<-0.05?'var(--color-border-danger)':'var(--color-border-warning)'}`,
                      background:isBeta?'var(--color-background-secondary)':helixMod.delta>0?'var(--color-background-success)':helixMod.delta<-0.05?'var(--color-background-danger)':'var(--color-background-warning)',
                      marginBottom:10,opacity:isBeta?0.75:1}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                        <div>
                          <span style={{...S.lbl,
                            color:isBeta?'var(--color-text-secondary)':helixMod.delta>0?'var(--color-text-success)':helixMod.delta<-0.05?'var(--color-text-danger)':'var(--color-text-warning)'}}>
                            {isBeta ? 'Helix propensity (참고용 — IC50 무관)' : 'Modified helix propensity'}
                          </span>
                          <div style={{fontSize:10,color:'var(--color-text-secondary)',marginTop:2}}>
                            {isBeta
                              ? 'β-strand 결합 (AF3 확인) → helix 변화가 IC50/KD에 직접 영향 없음 · 구조 참고용으로만'
                              : `base ${avgHP.toFixed(3)} ${helixMod.delta>=0?'+':'−'} FA/linker ${Math.abs(helixMod.delta).toFixed(3)} → ${isHelix?'IC50 계산에 반영 (Ward 2013)':'binding 영향 불분명'}`}
                          </div>
                        </div>
                        <div style={{textAlign:'right'}}>
                          <div style={{fontSize:26,fontWeight:500,fontFamily:'var(--font-mono)',
                            color:isBeta?'var(--color-text-secondary)':helixMod.delta>0?'var(--color-text-success)':helixMod.delta<-0.05?'var(--color-text-danger)':'var(--color-text-primary)'}}>
                            {helixMod.modifiedAvg.toFixed(3)}
                          </div>
                          <div style={{fontSize:10,color:'var(--color-text-secondary)'}}>
                            {helixMod.delta>=0?'+':''}{helixMod.delta.toFixed(3)}
                          </div>
                        </div>
                      </div>
                      {isBeta&&(
                        <div style={{fontSize:9,padding:'4px 8px',borderRadius:4,
                          background:'var(--color-background-tertiary)',color:'var(--color-text-secondary)'}}>
                          ℹ Ward 2013 helix 안정화 메커니즘 = GLP-1R 등 α-helix 결합 시스템에만 해당.
                        </div>
                      )}
                      {helixMod.notes.length>0&&(
                        <div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:4}}>
                          {helixMod.notes.map((n,i)=>(
                            <div key={i} style={{fontSize:10,padding:'2px 8px',borderRadius:999,
                              background:'var(--color-background-secondary)',color:'var(--color-text-secondary)',
                              border:'0.5px solid var(--color-border-tertiary)'}}>
                              {n}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* FA helix effect panel — only show for helix-binding, hide for beta-strand */}
                {hasFA&&scoreResult?.bindingMode?.mode !== 'beta_strand'&&(
                  <div style={{...S.card,border:'0.5px solid var(--color-border-warning)',background:'var(--color-background-warning)',marginBottom:10}}>
                    <span style={{...S.lbl,color:'var(--color-text-warning)'}}>FA 수식 → Helix 안정화 효과</span>
                    <div style={{fontSize:11,color:'var(--color-text-secondary)',lineHeight:1.75}}>
                      {/* Compute FA positions and their face */}
                      {(()=>{
                        const d=100*Math.PI/180;
                        const faEntries=Object.entries(atts||{}).filter(([,ch])=>ch?.some(i=>i?.type==='fa'));
                        if(!faEntries.length) return null;

                        // For each FA residue, determine if it's on hydrophobic (angle near 0°) or hydrophilic face
                        // Hydrophobic face: angle ±60° from 0° (right side of wheel)
                        const lines=[];
                        faEntries.forEach(([pk,ch])=>{
                          const faId=ch.find(i=>i?.type==='fa')?.id||'?';
                          const boost=FA_HYDRO_BOOST[faId]??1.5;
                          const faC=FAS?.find?.(f=>f.id===faId)?.C??18;

                          if(pk==='nterm'||pk==='cterm'){
                            lines.push(
                              <div key={pk} style={{marginBottom:4}}>
                                <b style={{color:'var(--color-text-primary)'}}>{pk} FA ({faId}, C{faC})</b>:
                                {' '}말단 지방산 → 자가조립(self-assembly)·micelle 형성 촉진.
                                헬릭스 dipole과 상호작용하여 N-cap/C-cap 안정화.
                                유효 소수성 기여 +{boost.toFixed(1)}.
                              </div>
                            );
                          } else {
                            const m=pk.match(/\d+/); if(!m) return;
                            const ri=parseInt(m[0]);
                            const angle=((ri*(100*Math.PI/180)) % (2*Math.PI));
                            // Project angle to -π~π range
                            const normAngle=(angle+Math.PI)%(2*Math.PI)-Math.PI;
                            const absAngle=Math.abs(normAngle);
                            const onHydrophobic=absAngle<Math.PI/3 || absAngle>5*Math.PI/3;
                            const face=onHydrophobic?'소수성 면 (hydrophobic face)':'친수성 면 (hydrophilic face)';
                            const effect=onHydrophobic
                              ? `✓ µH ↑↑ — hydrophobic face 강화. Helix 안정화 최적 위치. C${faC} FA → µH +${(boost*0.15).toFixed(2)} 추정`
                              : `△ 위치 주의 — hydrophilic face에 소수성 chain 추가 → 양친매성 약화 가능. µH 변화 ±`;
                            lines.push(
                              <div key={pk} style={{marginBottom:4}}>
                                <b style={{color:'var(--color-text-primary)'}}>{seq[ri]}{ri+1} FA ({faId}, C{faC})</b>
                                {' · '}<span style={{color:onHydrophobic?'var(--color-text-success)':'var(--color-text-warning)'}}>{face}</span>
                                <br/>{effect}
                              </div>
                            );
                          }
                        });
                        return lines;
                      })()}
                    </div>
                    <div style={{marginTop:8,fontSize:10,color:'var(--color-text-secondary)',borderTop:'0.5px solid var(--color-border-warning)',paddingTop:6,lineHeight:1.6}}>
                      <b style={{color:'var(--color-text-primary)'}}>FA의 helix 안정화 메커니즘 (Ref: Murase 2020 JACS; Kurtzhals 1995 Biochem J):</b><br/>
                      1. <b>Hydrophobic face anchoring</b>: FA가 소수성 면에 → 소수성 코어 강화 → µH ↑ → helix 안정<br/>
                      2. <b>Conformational entropy 감소</b>: 큰 지방사슬이 backbone 회전 제한 → helix 선호<br/>
                      3. <b>Self-assembly / micelle</b>: 임계 농도 이상에서 FA끼리 집합 → helix-helix 접촉으로 구조 고정<br/>
                      4. <b>Membrane anchor</b>: FA가 지질막에 삽입되면 막 내 helix 강력 안정화
                    </div>
                  </div>
                )}

                {/* ── 2D SECONDARY STRUCTURE ── */}
                {seq.length>0&&(
                  <div style={{...S.card,marginBottom:14}}>
                    <span style={S.lbl}>Secondary structure prediction (2D)</span>
                    <div style={{fontSize:10,color:'var(--color-text-secondary)',marginBottom:6,lineHeight:1.6}}>
                      Chou-Fasman (1978) · <b style={{color:'var(--color-text-primary)'}}>자유 펩타이드 구조 예측</b> (결합 시 구조와 다를 수 있음) · 불확도 ±15%
                    </div>
                    {/* Binding mode note */}
                    {scoreResult?.bindingMode&&(
                      <div style={{padding:'5px 10px',marginBottom:8,borderRadius:4,fontSize:9,lineHeight:1.6,
                        background:scoreResult.bindingMode.mode==='beta_strand'?'#eff6ff':
                                   scoreResult.bindingMode.mode==='helix'?'#f0fdf4':'var(--color-background-secondary)',
                        color:scoreResult.bindingMode.mode==='beta_strand'?'#1d4ed8':
                              scoreResult.bindingMode.mode==='helix'?'#15803d':'var(--color-text-secondary)'}}>
                        {scoreResult.bindingMode.mode==='beta_strand'&&(
                          <>
                            AF3 확인 β-strand (iPTM=0.89, 이 서열 기준). 나머지 부분은 자유 펩타이드 예측.
                            α-Helix 부분은 <b>결합 interface와 무관</b> — IC50에 영향 없음.
                          </>
                        )}
                        {scoreResult.bindingMode.mode==='helix'&&(
                          <>
                            <b>결합 시 구조:</b> α-helix 결합 예측. FA에 의한 helix 안정화 → IC50 개선 가능.
                          </>
                        )}
                        {scoreResult.bindingMode.mode==='extended_loop'&&(
                          <>
                            <b>결합 구조 불분명:</b> AlphaFold3 복합체 예측 권장.
                          </>
                        )}
                      </div>
                    )}
                    {fbStart!=null&&(
                      <div style={{fontSize:9,color:'var(--color-text-success)',marginBottom:6}}>
                        {' '}· 나머지 부분 Chou-Fasman 예측 (참고용)
                      </div>
                    )}
                    {/* Legend */}
                    <div style={{display:'flex',gap:12,marginBottom:8,flexWrap:'wrap'}}>
                      {[
                        {col:'#e53e3e',label:'α-Helix (H)'},
                        {col:'#2b6cb0',label:'β-Strand (E)'},
                        {col:'#718096',label:'Coil (C)'},
                        {col:'#16a34a',label:'Helix 안정화 (+)'},
                        {col:'#dc2626',label:'Helix 불안정화 (−)'},
                        {col:'#7c3aed',label:'Linker'},
                        {col:'#f59e0b',label:'FA'},
                      ].map((l,i)=>(
                        <div key={i} style={{display:'flex',alignItems:'center',gap:4,fontSize:10,color:'var(--color-text-secondary)'}}>
                          <div style={{width:12,height:12,borderRadius:2,background:l.col}}/>
                          {l.label}
                        </div>
                      ))}
                    </div>
                    {/* SVG diagram */}
                    <div style={{overflowX:'auto'}}>
                      {(()=>{
                        // Layout constants
                        const MOD_AREA_H = 80;
                        const SS_TOP     = MOD_AREA_H + 8;
                        const RES_Y      = SS_TOP + 52;
                        const POS_Y      = RES_Y + 12;
                        const DAA_Y      = POS_Y + 12;
                        const BRACE_Y    = DAA_Y + 10;
                        const TOTAL_H    = BRACE_Y + 22;
                        const W          = Math.max(600, seq.length*22+120);
                        const RES_X      = i => 50 + i*22;
                        const perPos     = helixMod?.perPos || {};

                        // Helper: draw chain items going upward from baseY
                        // color = green if stabilizing, red if destabilizing, default if neutral
                        const drawChain = (chain, cx, baseY, key, helixDelta) => {
                          if(!chain?.length) return null;
                          const items = [...chain].reverse();
                          const elems = [];
                          const chainH = items.length * 16 + 4;
                          // Stability indicator color for this chain
                          const stabCol = helixDelta > 0.01 ? '#16a34a' :
                                          helixDelta < -0.01 ? '#dc2626' : null;
                          // Stem line — colored if stabilizing/destabilizing
                          elems.push(<line key={`stem-${key}`}
                            x1={cx} y1={baseY - chainH - 2}
                            x2={cx} y2={baseY}
                            stroke={stabCol || '#d1d5db'} strokeWidth={stabCol?1.5:1}
                            strokeDasharray="2,1"/>);
                          // Stability badge at top of chain
                          if(stabCol) {
                            elems.push(
                              <g key={`stab-${key}`}>
                                <rect x={cx-12} y={baseY-chainH-14} width={25} height={11}
                                  fill={stabCol} rx={2} opacity={0.9}/>
                                <text x={cx} y={baseY-chainH-6} textAnchor="middle"
                                  fontSize="6.5" fill="white" fontWeight="700">
                                  {helixDelta>0?`+${helixDelta.toFixed(2)}`:`${helixDelta.toFixed(2)}`}
                                </text>
                              </g>
                            );
                          }
                          items.forEach((item,idx)=>{
                            const isFA = item?.type==='fa';
                            const label = isFA
                              ? (FAS.find(f=>f.id===item.id)?.lab?.replace(/^C\d+\s*/,'').slice(0,5)||'FA')
                              : (LINKERS.find(l=>l.id===item.id)?.lab?.replace(/\s*×\d+$/,'').slice(0,5)||'LNK');
                            // Use stability color if available, else default
                            const fill  = stabCol || (isFA ? '#f59e0b' : '#7c3aed');
                            const bkgd  = stabCol
                              ? (stabCol==='#16a34a' ? '#f0fdf4' : '#fef2f2')
                              : (isFA ? '#fffbeb' : '#f5f3ff');
                            const bord  = stabCol || (isFA ? '#d97706' : '#6d28d9');
                            const y = baseY - (idx+1)*16;
                            elems.push(
                              <rect key={`box-${key}-${idx}`}
                                x={cx-10} y={y} width={20} height={13}
                                fill={bkgd} stroke={bord} strokeWidth={1.2} rx={2}/>
                            );
                            elems.push(
                              <text key={`lbl-${key}-${idx}`}
                                x={cx} y={y+9} textAnchor="middle"
                                fontSize="6.5" fill={fill} fontWeight="600">{label}</text>
                            );
                          });
                          return elems;
                        };

                        // Helper: same for N/C-term
                        const drawTermChain = (chain, cx, baseY, key) => {
                          const posKey = key; // 'nterm' or 'cterm'
                          const helixDelta = perPos[posKey] || 0;
                          return drawChain(chain, cx, baseY, key, helixDelta);
                        };

                        return (
                          <svg viewBox={`0 0 ${W} ${TOTAL_H}`}
                            style={{width:'100%',minWidth:Math.min(600,W),fontFamily:'var(--font-mono)'}}>

                            {/* N-term modifications */}
                            {(atts?.['nterm']?.length>0)&&(()=>{
                              const cx=28, baseY=SS_TOP+6;
                              return <g key="nterm-chain">{drawTermChain(atts['nterm'],cx,baseY,'nterm')}</g>;
                            })()}

                            {/* C-term modifications */}
                            {(atts?.['cterm']?.length>0)&&(()=>{
                              const cx=RES_X(seq.length), baseY=SS_TOP+6;
                              return <g key="cterm-chain">{drawTermChain(atts['cterm'],cx,baseY,'cterm')}</g>;
                            })()}

                            {/* Per-residue */}
                            {[...seq].map((aa,i)=>{
                              const s=ss[i]||'C';
                              const inFB=fbStart!=null&&i>=fbStart&&i<=fbStart+9;
                              const chain=atts?.[`r${i}`]||[];
                              const hasMod=chain.length>0;
                              const isD=!!dAA[i];
                              const cx=RES_X(i);
                              const posKey=`r${i}`;
                              const helixDelta=perPos[posKey]||0;
                              const barH=s==='H'?36:s==='E'?26:16;
                              const barY=SS_TOP+(44-barH);
                              // Helix border: thicker + green if stabilized, red if destabilized
                              const stabBorder = hasMod && helixDelta>0.01 ? '#16a34a' :
                                                 hasMod && helixDelta<-0.01 ? '#dc2626' : null;
                              const barCol=stabBorder||(inFB?'#2b6cb0':s==='H'?'#e53e3e':s==='E'?'#3182ce':'#a0aec0');
                              const bgCol=inFB?'#ebf8ff':s==='H'?'#fff5f5':s==='E'?'#ebf8ff':'#f7fafc';
                              const strokeW = stabBorder ? 2.5 : 1.5;
                              return(
                                <g key={i}>
                                  {/* Modification chain hanging upward */}
                                  {hasMod && drawChain(chain, cx, barY, i, helixDelta)}

                                  {/* Structure body */}
                                  {s==='H'?(
                                    <rect x={cx-8} y={barY} width={17} height={barH}
                                      fill={bgCol} stroke={barCol} strokeWidth={strokeW} rx={4}/>
                                  ):s==='E'?(
                                    i<seq.length-1&&ss[i+1]==='E'?(
                                      <rect x={cx-8} y={barY} width={17} height={barH}
                                        fill={bgCol} stroke={barCol} strokeWidth={strokeW} rx={1}/>
                                    ):(
                                      <polygon
                                        points={`${cx-8},${barY} ${cx+9},${barY} ${cx+14},${barY+barH/2} ${cx+9},${barY+barH} ${cx-8},${barY+barH}`}
                                        fill={bgCol} stroke={barCol} strokeWidth={strokeW}/>
                                    )
                                  ):(
                                    <line x1={cx+1} y1={barY} x2={cx+1} y2={barY+barH}
                                      stroke={barCol} strokeWidth={2.5} strokeLinecap="round"/>
                                  )}

                                  {/* SS label */}
                                  <text x={cx+1} y={barY-2} textAnchor="middle"
                                    fontSize="7" fill={barCol} fontWeight="600">{s}</text>

                                  {/* Residue letter */}
                                  <text x={cx+1} y={RES_Y} textAnchor="middle"
                                    fontSize="9.5" fontWeight={inFB?'700':'500'}
                                    fill={inFB?'#2b6cb0':isD?'#0f172a':'#4a5568'}>{aa}</text>

                                  {/* Position number every 5 */}
                                  {(i+1)%5===0&&(
                                    <text x={cx+1} y={POS_Y} textAnchor="middle"
                                      fontSize="7.5" fill="#94a3b8">{i+1}</text>
                                  )}

                                  {/* D-AA marker */}
                                  {isD&&(
                                    <text x={cx+1} y={DAA_Y} textAnchor="middle"
                                      fontSize="6" fill="#0f172a" fontWeight="700">D</text>
                                  )}
                                </g>
                              );
                            })}

                            {fbStart!=null&&(
                              <g>
                                <line x1={RES_X(fbStart)-8} y1={BRACE_Y}
                                      x2={RES_X(fbStart+9)+9} y2={BRACE_Y}
                                  stroke="#d97706" strokeWidth={1.5}/>
                                <line x1={RES_X(fbStart)-8} y1={BRACE_Y-4}
                                      x2={RES_X(fbStart)-8} y2={BRACE_Y+4}
                                  stroke="#d97706" strokeWidth={1.5}/>
                                <line x1={RES_X(fbStart+9)+9} y1={BRACE_Y-4}
                                      x2={RES_X(fbStart+9)+9} y2={BRACE_Y+4}
                                  stroke="#d97706" strokeWidth={1.5}/>
                                <text x={RES_X(fbStart+4.5)} y={BRACE_Y+14}
                                  textAnchor="middle" fontSize="8" fill="#d97706" fontWeight="600">
                                </text>
                              </g>
                            )}

                            {/* N/C term labels */}
                            <text x={16} y={RES_Y} textAnchor="middle" fontSize="8" fill="#94a3b8">N</text>
                            <text x={RES_X(seq.length)+2} y={RES_Y} textAnchor="middle" fontSize="8" fill="#94a3b8">C</text>
                          </svg>
                        );
                      })()}
                    </div>
                    {/* SS summary */}
                    <div style={{display:'flex',gap:16,marginTop:8,fontSize:11,color:'var(--color-text-secondary)'}}>
                      {[
                        {label:'α-Helix',val:ss.filter(s=>s==='H').length,col:'#e53e3e'},
                        {label:'β-Strand',val:ss.filter(s=>s==='E').length,col:'#2b6cb0'},
                        {label:'Coil',val:ss.filter(s=>s==='C').length,col:'#718096'},
                      ].map((x,i)=>(
                        <div key={i} style={{display:'flex',alignItems:'center',gap:4}}>
                          <div style={{width:8,height:8,borderRadius:2,background:x.col}}/>
                          <span style={{color:x.col,fontWeight:500}}>{x.val}</span>
                          <span>{x.label} ({seq.length>0?(x.val/seq.length*100).toFixed(0):0}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{display:'flex',gap:14,alignItems:'flex-start',marginBottom:14}}>
                <div style={{...S.card,flex:'0 0 auto'}}>
                    <span style={S.lbl}>Helical wheel (first 20 residues)</span>
                    <HelixWheel seq={seq} dAA={dAA} atts={atts}
                      effectiveType={effectiveType}
                      effectiveHydro={effectiveHydro}
                      />
                    <div style={{fontSize:10,color:'var(--color-text-secondary)',marginTop:4,textAlign:'center',lineHeight:1.5}}>
                      α-helix: 3.6 res/turn · 100°/residue<br/>
                      D-AA는 side chain이 180° 반전되어 표시됨
                      {Object.values(dAA).some(Boolean)&&<span style={{color:'var(--color-text-warning)'}}> · µH 재계산됨</span>}
                    </div>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={S.card}>
                      <span style={S.lbl}>Hydrophobicity per residue (Kyte-Doolittle)</span>
                      <ResBar values={effectiveHydro} colors={seqColors} labels={[...seq]} zero={40} scale={4}/>
                      <div style={{fontSize:10,color:'var(--color-text-secondary)',marginTop:4}}>
                        Above = hydrophobic · below = hydrophilic
                        {hasFA&&<span style={{color:'var(--color-text-warning)'}}> · FA 수식 잔기 소수성 반영됨</span>}
                      </div>
                    </div>
                    <div style={S.card}>
                      <span style={S.lbl}>Helix propensity per residue (windowed ±2)</span>
                      <ResBar values={helixPs.map(v=>v-1.0)} colors={seqColors} labels={[...seq]} zero={40} scale={40}/>
                      <div style={{fontSize:10,color:'var(--color-text-secondary)',marginTop:4}}>Above = helix-forming (pHx &gt; 1.0)</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── BINDING ── */}
            {tab==='binding'&&(
              <div>
                {/* Target selector */}
                <div style={S.card}>
                  <span style={S.lbl}>Binding target</span>
                  <div style={{display:'flex',gap:8}}>
                    {TGT_OPTS.map(t=>(
                      <button key={t.id} onClick={()=>setTarget(t.id)} style={{
                        flex:1,textAlign:'left',padding:'10px 12px',cursor:'pointer',
                        background:target===t.id?'var(--color-background-info)':'var(--color-background-secondary)',
                        border:target===t.id?'2px solid var(--color-border-info)':'0.5px solid var(--color-border-secondary)',
                        borderRadius:'var(--border-radius-lg)'}}>
                        <div style={{fontSize:18,marginBottom:3}}>{t.icon}</div>
                        <div style={{fontSize:12,fontWeight:500,color:'var(--color-text-primary)',marginBottom:2}}>{t.label}</div>
                        <div style={{fontSize:10,color:'var(--color-text-secondary)',lineHeight:1.4}}>{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── SPECIFIC TARGET ── */}
                {target==='specific'&&(
                  <div>
                    {/* Target input */}
                    <div style={S.card}>
                      <span style={S.lbl}>Target sequence</span>
                      <div style={{marginBottom:10}}>
                        <div style={{fontSize:11,color:'var(--color-text-secondary)',marginBottom:4}}>Name / description (optional)</div>
                        <input value={tgtName} onChange={e=>setTgtName(e.target.value)}
                          placeholder="e.g. GLP-1R ECD, integrin αVβ3, CXCR4 N-terminus..."
                          style={{width:'100%',boxSizing:'border-box',padding:'6px 8px',fontSize:13,outline:'none',
                            background:'var(--color-background-tertiary)',border:'0.5px solid var(--color-border-secondary)',
                            borderRadius:'var(--border-radius-md)',color:'var(--color-text-primary)'}}/>
                      </div>
                      <div>
                        <div style={{fontSize:11,color:'var(--color-text-secondary)',marginBottom:4}}>Sequence (1-letter) *</div>
                        <textarea value={tgtRaw} onChange={e=>setTgtRaw(e.target.value)}
                          placeholder="Paste target protein / receptor / binding domain sequence..."
                          style={{width:'100%',boxSizing:'border-box',fontFamily:'var(--font-mono)',fontSize:13,
                            resize:'vertical',minHeight:80,padding:'6px 8px',outline:'none',
                            background:'var(--color-background-tertiary)',border:'0.5px solid var(--color-border-secondary)',
                            borderRadius:'var(--border-radius-md)',color:'var(--color-text-primary)'}}/>
                        <div style={{fontSize:11,color:'var(--color-text-secondary)',marginTop:4}}>{tgtSeq.length} valid residues</div>
                      </div>
                      {/* AlphaFold3 structure upload */}
                      <div style={{marginTop:8,padding:'8px 10px',background:'var(--color-background-tertiary)',
                        borderRadius:'var(--border-radius-md)',border:'1px dashed var(--color-border-secondary)'}}>
                        <div style={{fontSize:11,color:'var(--color-text-secondary)',marginBottom:4}}>
                          📐 AlphaFold3 구조 (.cif) — 3D 거리 기반 정확도 향상
                        </div>
                        <input type="file" accept=".cif" onChange={e=>{
                          const file=e.target.files?.[0];if(!file)return;
                          const reader=new FileReader();
                          reader.onload=ev=>{
                            const text=ev.target.result;
                            const atoms=parseCIF(text);
                            const analysis=analyzeStructure(atoms, seq, tgtSeq);
                            if(analysis) setStructData(analysis);
                            else alert('구조 파싱 실패. Chain A=peptide, Chain B=target 형식의 CIF 파일이 필요합니다.');
                          };
                          reader.readAsText(file);
                        }} style={{fontSize:11,color:'var(--color-text-primary)'}}/>
                        {structData&&(
                          <div style={{marginTop:6,fontSize:10,color:'var(--color-text-success)'}}>
                            ✓ 구조 로드됨: Chain A {structData.chainALen}aa, Chain B {structData.chainBLen}aa
                            · Interface 잔기: {structData.interfaceRes.length}개
                            · Hydrophobic contacts: {structData.hydroContacts.length}개
                            <button onClick={()=>setStructData(null)} style={{marginLeft:8,fontSize:9,cursor:'pointer',
                              background:'none',border:'1px solid var(--color-border-danger)',borderRadius:3,
                              color:'var(--color-text-danger)',padding:'1px 5px'}}>제거</button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Target properties */}
                    {tgtProps&&(
                      <div style={S.card}>
                        <span style={S.lbl}>Target physicochemical properties</span>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:8,marginBottom:0}}>
                          {[
                            {l:'MW',v:`${tgtProps.mw.toFixed(0)}`,u:'Da'},
                            {l:'pI',v:tgtProps.pI?tgtProps.pI.toFixed(2):'—',u:''},
                            {l:'Charge pH 7.4',v:tgtProps.q74.toFixed(2),u:'e'},
                            {l:'GRAVY',v:tgtProps.gravy?.toFixed(3)??'—',u:''},
                          ].map(({l,v,u})=>(
                            <div key={l} style={{background:'var(--color-background-secondary)',borderRadius:'var(--border-radius-md)',padding:'8px 10px'}}>
                              <div style={{fontSize:10,color:'var(--color-text-secondary)',marginBottom:2}}>{l}</div>
                              <div style={{fontSize:16,fontWeight:500,color:'var(--color-text-primary)',fontFamily:'var(--font-mono)'}}>
                                {v} <span style={{fontSize:10,color:'var(--color-text-secondary)'}}>{u}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ══ SCORING ══ */}
                    {scoreResult&&(
                      <div>

                        {/* ━━ BINDING MODE BANNER ━━ */}
                        {scoreResult.bindingMode&&(
                          <div style={{
                            marginBottom:10,padding:'10px 14px',
                            border:`1.5px solid ${scoreResult.bindingMode.color}44`,
                            borderLeft:`4px solid ${scoreResult.bindingMode.color}`,
                            borderRadius:'var(--border-radius-md)',
                            background:'var(--color-background-secondary)',
                          }}>
                            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6,flexWrap:'wrap'}}>
                              {/* Mode badge — the main thing */}
                              <span style={{
                                fontSize:13,fontWeight:700,padding:'3px 12px',
                                borderRadius:999,
                                background:`${scoreResult.bindingMode.color}18`,
                                color:scoreResult.bindingMode.color,
                                border:`1.5px solid ${scoreResult.bindingMode.color}`,
                              }}>
                                {scoreResult.bindingMode.mode==='beta_strand' ? 'β-strand 결합'
                                 : scoreResult.bindingMode.mode==='helix'      ? 'α-helix 결합'
                                 : 'Extended loop (불분명)'}
                              </span>
                              <span style={{fontSize:9,color:'var(--color-text-secondary)'}}>
                                {scoreResult.bindingMode.confidence==='high'
                                  ? '★★★ ' + scoreResult.bindingMode.source.split('(')[0].trim()
                                  : '★★☆ Chou-Fasman 추정 — AlphaFold3 검증 권장'}
                              </span>
                              <span style={{
                                marginLeft:'auto',fontSize:9,padding:'1px 7px',
                                borderRadius:999,
                                background:scoreResult.bindingMode.helixBenefit?'#dcfce7':'#fef2f2',
                                color:scoreResult.bindingMode.helixBenefit?'#15803d':'#b91c1c',
                              }}>
                                FA helix 효과: {scoreResult.bindingMode.helixBenefit?'✓ IC50 개선 가능':'✗ IC50 무관'}
                              </span>
                            </div>
                            <div style={{fontSize:10,color:'var(--color-text-secondary)',lineHeight:1.6,marginBottom:6}}>
                              {scoreResult.bindingMode.description}
                            </div>
                            <div style={{fontSize:10,lineHeight:1.6,
                              padding:'5px 8px',borderRadius:'var(--border-radius-md)',
                              background:`${scoreResult.bindingMode.color}0e`,
                              color:scoreResult.bindingMode.color,fontWeight:500}}>
                              💉 FA 설계: {scoreResult.bindingMode.faAdvice}
                            </div>
                          </div>
                        )}

                        {/* ━━━ 히스토리 ━━━ */}
                        {history.length>0&&(
                          <div style={{marginTop:16}}>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                              <span style={{fontSize:11,fontWeight:500,color:'var(--color-text-secondary)'}}>기록 ({history.length})</span>
                              <button onClick={()=>{setHistory([]);try{localStorage.removeItem('peptide_history');}catch{}}} style={{
                                fontSize:10,padding:'2px 8px',cursor:'pointer',
                                background:'transparent',border:'0.5px solid var(--color-border-tertiary)',
                                borderRadius:'var(--border-radius-md)',color:'var(--color-text-secondary)',
                              }}>전체 삭제</button>
                            </div>
                            <div style={{overflowX:'auto'}}>
                              <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                                <thead>
                                  <tr style={{borderBottom:'1px solid var(--color-border-tertiary)',color:'var(--color-text-secondary)'}}>
                                    <th style={{textAlign:'left',padding:'4px 6px',fontWeight:500,minWidth:80}}>저장 시각</th>
                                    <th style={{textAlign:'left',padding:'4px 6px',fontWeight:500}}>서열</th>
                                    <th style={{textAlign:'left',padding:'4px 6px',fontWeight:500}}>수식</th>
                                    <th style={{textAlign:'right',padding:'4px 6px',fontWeight:500}}>IC50 A2</th>
                                    <th style={{textAlign:'right',padding:'4px 6px',fontWeight:500}}>Est. KD</th>
                                    <th style={{textAlign:'right',padding:'4px 6px',fontWeight:500}}>뇌 유효 IC50</th>
                                    <th style={{textAlign:'right',padding:'4px 6px',fontWeight:500}}>반감기</th>
                                    <th style={{padding:'4px 6px'}}></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {history.map((h,i)=>(
                                    <tr key={i} style={{borderBottom:'0.5px solid var(--color-border-tertiary)'}}>
                                      <td style={{padding:'5px 6px',color:'var(--color-text-secondary)',fontSize:10,whiteSpace:'nowrap'}}>{h.savedAt}</td>
                                      <td style={{padding:'5px 6px',fontFamily:'var(--font-mono)',fontSize:10}}>{h.seq}</td>
                                      <td style={{padding:'5px 6px',fontSize:10,color:'var(--color-text-secondary)'}}>{h.mod}</td>
                                      <td style={{textAlign:'right',padding:'5px 6px',fontFamily:'var(--font-mono)',fontSize:11}}>{fmtKd(h.ic50a2)}</td>
                                      <td style={{textAlign:'right',padding:'5px 6px',fontFamily:'var(--font-mono)',fontSize:11,color:'var(--color-text-info)'}}>{fmtKd(h.kd)}</td>
                                      <td style={{textAlign:'right',padding:'5px 6px',fontFamily:'var(--font-mono)',fontSize:11}}>{fmtKd(h.brainIC50)}</td>
                                      <td style={{textAlign:'right',padding:'5px 6px',color:'var(--color-text-secondary)'}}>{h.hl}</td>
                                      <td style={{padding:'5px 6px'}}>
                                        <button onClick={()=>setHistory(prev=>{const n=[...prev];n.splice(i,1);try{localStorage.setItem('peptide_history',JSON.stringify(n));}catch{}return n;})}
                                          style={{fontSize:10,padding:'1px 6px',cursor:'pointer',background:'transparent',border:'0.5px solid var(--color-border-tertiary)',borderRadius:4,color:'var(--color-text-secondary)'}}>
                                          ×
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                          <div>
                            <div style={S.card}>
                              <span style={S.lbl}>Binding feature analysis</span>
                              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                                {scoreResult.qual.map((c,i)=>{
                                  const col=c.score/c.max>=0.8?'var(--color-text-success)':c.score/c.max>=0.6?'var(--color-text-warning)':'var(--color-text-danger)';
                                  return(<div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
                                    <div style={{fontSize:11,color:'var(--color-text-secondary)',flex:'0 0 180px'}}>{c.name}</div>
                                    <div style={{display:'flex',gap:2}}>{Array.from({length:c.max},(_,j)=>(
                                      <div key={j} style={{width:13,height:13,borderRadius:3,
                                        background:j<c.score?col:'var(--color-background-tertiary)',
                                        border:`0.5px solid ${j<c.score?col:'var(--color-border-secondary)'}`}}/>
                                    ))}</div>
                                    <div style={{fontSize:10,color:col,fontFamily:'var(--font-mono)'}}>{c.score}/{c.max}</div>
                                    <div style={{fontSize:10,color:'var(--color-text-secondary)',flex:1}}>{c.note}</div>
                                  </div>);
                                })}
                              </div>
                            </div>
                            <div style={{...S.card,border:'0.5px solid var(--color-border-info)',background:'var(--color-background-info)'}}>
                              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                                <div>
                                  <span style={{...S.lbl,marginBottom:2}}>Empirical Kd estimate</span>
                                  <div style={{fontSize:11,color:'var(--color-text-secondary)'}}>{scoreResult.emp.dominant} · ±2 log units</div>
                                </div>
                                <div style={{textAlign:'right'}}>
                                  <div style={{fontSize:26,fontWeight:500,fontFamily:'var(--font-mono)'}}>
                                    {bindingModeFAEffect&&bindingModeFAEffect.factor!==1.0
                                      ? fmtKd(scoreResult.emp.Kd_nM * bindingModeFAEffect.factor)
                                      : fmtKd(scoreResult.emp.Kd_nM)}
                                  </div>
                                  <div style={{fontSize:10,color:'var(--color-text-secondary)'}}>
                                    {fmtKd(scoreResult.emp.Kd_low_nM)} — {fmtKd(scoreResult.emp.Kd_high_nM)}
                                  </div>
                                  {bindingModeFAEffect&&bindingModeFAEffect.factor!==1.0&&(
                                    <div style={{fontSize:9,color:'var(--color-text-secondary)',textDecoration:'line-through'}}>
                                      기본: {fmtKd(scoreResult.emp.Kd_nM)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Binding mode FA effect detail */}
                            {bindingModeFAEffect&&(
                              <div style={{...S.card,padding:'8px 12px',
                                borderLeft:`3px solid ${scoreResult.bindingMode?.color||'#94a3b8'}`,
                                background:'var(--color-background-secondary)'}}>
                                <div style={{fontSize:10,fontWeight:600,marginBottom:4,
                                  color:scoreResult.bindingMode?.color||'var(--color-text-primary)'}}>
                                  {scoreResult.bindingMode?.label||'Binding mode'} — FA IC50/KD 영향
                                </div>
                                {bindingModeFAEffect.notes.map((n,i)=>(
                                  <div key={i} style={{fontSize:9,color:'var(--color-text-secondary)',
                                    lineHeight:1.6,marginBottom:2}}>
                                    {n}
                                  </div>
                                ))}
                                {bindingModeFAEffect.deltaHelicity!==null&&(
                                  <div style={{fontSize:9,marginTop:4,padding:'3px 6px',
                                    background:'#f0fdf4',borderRadius:4,color:'#15803d'}}>
                                    Δhelicity = {bindingModeFAEffect.deltaHelicity>=0?'+':''}{(bindingModeFAEffect.deltaHelicity*100).toFixed(1)}%
                                    → KD {bindingModeFAEffect.factor<1
                                      ? `×${bindingModeFAEffect.factor.toFixed(2)} 개선 (FA helix 안정화)`
                                      : `×${bindingModeFAEffect.factor.toFixed(2)} 악화`}
                                  </div>
                                )}
                              </div>
                            )}
                            <div style={{...S.card,background:'var(--color-background-secondary)'}}>
                              <span style={S.lbl}>Better Kd — free tools</span>
                              <div style={{fontSize:12,lineHeight:1.9}}>
                                <div><b style={{fontWeight:500}}>Step 1</b> Structure →{' '}<a href="https://colab.research.google.com/github/sokrypton/ColabFold/blob/main/AlphaFold2.ipynb" style={{color:'var(--color-text-info)'}}>ColabFold ↗</a></div>
                                <div><b style={{fontWeight:500}}>Step 2</b> Kd →{' '}<a href="https://wenmr.science.uu.nl/prodigy/" style={{color:'var(--color-text-info)'}}>PRODIGY ↗</a>{' '}(Vangone & Bonvin 2015, ±1 log unit)</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ══ AI LITERATURE SEARCH ══ */}
                    <div style={S.card}>
                      <span style={S.lbl}>AI literature search</span>
                      <div style={{fontSize:12,color:'var(--color-text-secondary)',marginBottom:12,lineHeight:1.6}}>
                        AI identifies the target and retrieves <b style={{fontWeight:500,color:'var(--color-text-primary)'}}>experimentally measured Kd values</b> from
                        published literature for similar peptide-target pairs. It does <b style={{fontWeight:500,color:'var(--color-text-primary)'}}>not generate estimates</b> — it
                        reports only what was actually measured.
                      </div>
                      <button onClick={searchLiterature}
                        disabled={aiLoading||!seq.length||!tgtSeq.length}
                        style={{padding:'10px 20px',fontSize:13,fontWeight:500,
                          cursor:(!seq.length||!tgtSeq.length||aiLoading)?'not-allowed':'pointer',
                          opacity:(!seq.length||!tgtSeq.length)?0.4:1,
                          background:'var(--color-background-secondary)',color:'var(--color-text-primary)',
                          border:'0.5px solid var(--color-border-secondary)',borderRadius:'var(--border-radius-lg)',
                          width:'100%',}}>
                        {aiLoading?'⟳ Searching literature…':'🔍 Search published experimental data'}
                      </button>
                      {!tgtSeq.length&&<div style={{fontSize:11,color:'var(--color-text-secondary)',marginTop:6,textAlign:'center'}}>
                        Enter target sequence above to enable
                      </div>}
                    </div>

                    {aiLoading&&(
                      <div style={{...S.card,textAlign:'center',padding:24}}>
                        <div style={{fontSize:13,color:'var(--color-text-secondary)'}}>Searching literature for experimental binding data…</div>
                      </div>
                    )}
                    {aiError&&(
                      <div style={{...S.card,background:'var(--color-background-danger)',border:'0.5px solid var(--color-border-danger)'}}>
                        <span style={{...S.lbl,color:'var(--color-text-danger)'}}>Error</span>
                        <div style={{fontSize:12,color:'var(--color-text-danger)',fontFamily:'var(--font-mono)',wordBreak:'break-all'}}>{aiError}</div>
                      </div>
                    )}

                    {aiResult&&!aiLoading&&(
                      <div>
                        {/* Target identity */}
                        <div style={{...S.card,border:'0.5px solid var(--color-border-info)',background:'var(--color-background-info)'}}>
                          <span style={{...S.lbl,color:'var(--color-text-info)'}}>Target identification</span>
                          <div style={{display:'flex',gap:10,alignItems:'flex-start',flexWrap:'wrap'}}>
                            <div style={{flex:1,minWidth:200}}>
                              <div style={{fontSize:15,fontWeight:500,color:'var(--color-text-primary)',marginBottom:4}}>
                                {aiResult.target_identity??'Unrecognized'}
                              </div>
                              <div style={{fontSize:12,color:'var(--color-text-secondary)',lineHeight:1.5}}>
                                {aiResult.target_description}
                              </div>
                            </div>
                            <div>
                              {aiResult.query_peptide_recognized&&(
                                <div style={{fontSize:11,padding:'4px 10px',borderRadius:'var(--border-radius-md)',
                                  background:'var(--color-background-success)',color:'var(--color-text-success)',
                                  border:'0.5px solid var(--color-border-success)',whiteSpace:'nowrap'}}>
                                  Query: {aiResult.query_peptide_identity}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Experimental data table */}
                        {aiResult.experimental_data?.length>0&&(
                          <div style={S.card}>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                              <span style={S.lbl}>Published experimental Kd values</span>
                              <ConfBadge level={aiResult.data_confidence?.split(' ')[0]??'low'}/>
                            </div>
                            <div style={{overflowX:'auto'}}>
                              <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                                <thead>
                                  <tr style={{borderBottom:'0.5px solid var(--color-border-secondary)',color:'var(--color-text-secondary)',fontSize:10}}>
                                    <td style={{padding:'4px 8px'}}>Peptide</td>
                                    <td style={{padding:'4px 8px'}}>Kd</td>
                                    <td style={{padding:'4px 8px'}}>Method</td>
                                    <td style={{padding:'4px 8px'}}>Reference</td>
                                  </tr>
                                </thead>
                                <tbody>
                                  {aiResult.experimental_data.map((d,i)=>(
                                    <tr key={i} style={{borderBottom:'0.5px solid var(--color-border-tertiary)',
                                      background:d.peptide_name===aiResult.closest_analogue_to_query?'var(--color-background-info)':'transparent'}}>
                                      <td style={{padding:'6px 8px',color:'var(--color-text-primary)',fontFamily:'var(--font-mono)',fontSize:11}}>
                                        {d.peptide_name}
                                        {d.peptide_name===aiResult.closest_analogue_to_query&&(
                                          <span style={{fontSize:9,marginLeft:4,padding:'1px 5px',borderRadius:999,
                                            background:'var(--color-background-info)',color:'var(--color-text-info)',
                                            border:'0.5px solid var(--color-border-info)'}}>closest</span>
                                        )}
                                      </td>
                                      <td style={{padding:'6px 8px',fontFamily:'var(--font-mono)',fontWeight:500,
                                        color:'var(--color-text-success)',whiteSpace:'nowrap'}}>{d.Kd_value}</td>
                                      <td style={{padding:'6px 8px',color:'var(--color-text-secondary)',whiteSpace:'nowrap'}}>{d.method}</td>
                                      <td style={{padding:'6px 8px',color:'var(--color-text-secondary)',fontSize:10}}>{d.reference}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            {aiResult.data_confidence&&(
                              <div style={{fontSize:10,color:'var(--color-text-secondary)',marginTop:8}}>
                                Data confidence: {aiResult.data_confidence}
                              </div>
                            )}
                          </div>
                        )}

                        {aiResult.experimental_data?.length===0&&(
                          <div style={{...S.card,background:'var(--color-background-warning)',border:'0.5px solid var(--color-border-warning)'}}>
                            <div style={{fontSize:12,color:'var(--color-text-warning)',lineHeight:1.6}}>
                              No published experimental data found for this peptide-target pair in training knowledge.
                              This may be a novel target, a proprietary sequence, or an understudied interaction.
                            </div>
                          </div>
                        )}

                        {/* Modification effect + SAR */}
                        {(aiResult.expected_effect_of_modifications||aiResult.sar_context)&&(
                          <div style={S.card}>
                            {aiResult.sar_context&&(<>
                              <span style={S.lbl}>Known SAR context</span>
                              <div style={{fontSize:12,color:'var(--color-text-primary)',lineHeight:1.7,marginBottom:10}}>{aiResult.sar_context}</div>
                            </>)}
                            {aiResult.expected_effect_of_modifications&&(<>
                              <span style={S.lbl}>Effect of your modifications</span>
                              <div style={{fontSize:12,color:'var(--color-text-primary)',lineHeight:1.7}}>{aiResult.expected_effect_of_modifications}</div>
                            </>)}
                          </div>
                        )}

                        {aiResult.important_caveats&&(
                          <div style={{...S.card,background:'var(--color-background-warning)',border:'0.5px solid var(--color-border-warning)'}}>
                            <div style={{fontSize:11,color:'var(--color-text-warning)',lineHeight:1.6}}>
                              ⚠ {aiResult.important_caveats}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ALBUMIN / MEMBRANE */}
                {target!=='specific'&&(
                  <>
                    <div style={{...S.card,border:'0.5px solid var(--color-border-info)',background:'var(--color-background-info)'}}>
                      <span style={{...S.lbl,color:'var(--color-text-info)'}}>Estimated Kd (empirical model)</span>
                      <div style={{fontSize:40,fontWeight:500,color:'var(--color-text-primary)',fontFamily:'var(--font-mono)',letterSpacing:'0.03em'}}>
                        {kdEst?.best==null?'—':fmtKd(kdEst.best)}
                      </div>
                      {kdEst?.best!=null&&(<>
                        <div style={{fontSize:12,color:'var(--color-text-secondary)',marginTop:6}}>
                          Range: {fmtKd(kdEst.best/5)} — {fmtKd(kdEst.best*5)} &nbsp;(±1–2 orders)
                          {target==='albumin'&&kdEst.positions?.length>1&&
                            <span style={{marginLeft:8}}>· Best of {kdEst.positions.length} FA site(s)</span>}
                        </div>
                        <div style={{marginTop:10,padding:'8px 10px',
                          background:'var(--color-background-warning)',border:'0.5px solid var(--color-border-warning)',
                          borderRadius:'var(--border-radius-md)',fontSize:11,color:'var(--color-text-warning)'}}>
                          ⚠ Empirical model — validate with SPR, ITC, or fluorescence.
                        </div>
                      </>)}
                      {kdEst?.best==null&&target==='albumin'&&(
                        <div style={{fontSize:12,color:'var(--color-text-secondary)',marginTop:8}}>
                          Add a fatty acid modification to estimate albumin binding affinity.
                        </div>
                      )}
                    </div>

                    {/* Per-position Kd breakdown (albumin only) */}
                    {target==='albumin'&&kdEst?.positions?.length>0&&(
                      <div style={S.card}>
                        <span style={S.lbl}>Per-position Kd breakdown — position matters</span>
                        <div style={{fontSize:11,color:'var(--color-text-secondary)',marginBottom:10,lineHeight:1.6}}>
                          FA position affects albumin Kd through: (1) attachment site accessibility,
                          (2) neighboring charge environment, (3) steric effects. Each FA site is scored independently.
                        </div>
                        <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                          <thead>
                            <tr style={{borderBottom:'0.5px solid var(--color-border-secondary)',color:'var(--color-text-secondary)',fontSize:10}}>
                              <td style={{padding:'4px 6px'}}>Position</td>
                              <td style={{padding:'4px 6px'}}>FA · Linker</td>
                              <td style={{padding:'4px 6px',textAlign:'right'}}>Base Kd</td>
                              <td style={{padding:'4px 6px',textAlign:'right'}}>Pos. Δ</td>
                              <td style={{padding:'4px 6px',textAlign:'right',fontWeight:500}}>Final Kd</td>
                            </tr>
                          </thead>
                          <tbody>
                            {kdEst.positions.map((p,i)=>{
                              const isBest=p.kd_nM===kdEst.best;
                              return(
                                <tr key={i} style={{borderBottom:'0.5px solid var(--color-border-tertiary)',
                                  background:isBest?'var(--color-background-success)':'transparent'}}>
                                  <td style={{padding:'6px 6px',fontFamily:'var(--font-mono)',
                                    color:isBest?'var(--color-text-success)':'var(--color-text-info)',fontWeight:isBest?500:400}}>
                                    {posLabel(p.posKey)}{isBest&&<span style={{fontSize:9,marginLeft:4}}>★ best</span>}
                                  </td>
                                  <td style={{padding:'6px 6px',color:'var(--color-text-primary)'}}>
                                    {p.faLabel}
                                    {p.linkerLabel!=='none'&&<span style={{color:'var(--color-text-secondary)',marginLeft:4}}>+ {p.linkerLabel}</span>}
                                  </td>
                                  <td style={{padding:'6px 6px',textAlign:'right',fontFamily:'var(--font-mono)',color:'var(--color-text-secondary)'}}>
                                    {fmtKd(Math.pow(10,p.logKd_linker)*1000)}
                                  </td>
                                  <td style={{padding:'6px 6px',textAlign:'right',fontFamily:'var(--font-mono)',
                                    color:p.posDelta>0.05?'var(--color-text-danger)':p.posDelta<-0.05?'var(--color-text-success)':'var(--color-text-secondary)'}}>
                                    {p.posDelta===0?'—':p.posDelta>0?`+${p.posDelta.toFixed(2)}`:`${p.posDelta.toFixed(2)}`}
                                  </td>
                                  <td style={{padding:'6px 6px',textAlign:'right',fontFamily:'var(--font-mono)',
                                    fontWeight:isBest?500:400,color:isBest?'var(--color-text-success)':'var(--color-text-primary)'}}>
                                    {fmtKd(p.kd_nM)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        {kdEst.positions.some(p=>p.posReason)&&(
                          <div style={{marginTop:10,borderTop:'0.5px solid var(--color-border-tertiary)',paddingTop:8}}>
                            <div style={{fontSize:10,color:'var(--color-text-secondary)',marginBottom:4}}>Position correction details:</div>
                            {kdEst.positions.map((p,i)=>p.posReason?(
                              <div key={i} style={{fontSize:10,color:'var(--color-text-secondary)',lineHeight:1.6,marginBottom:2}}>
                                <span style={{color:'var(--color-text-info)',fontFamily:'var(--font-mono)'}}>{posLabel(p.posKey)}</span>:{' '}{p.posReason}
                              </div>
                            ):null)}
                          </div>
                        )}
                        <div style={{marginTop:8,fontSize:10,color:'var(--color-text-secondary)',lineHeight:1.6,
                          borderTop:'0.5px solid var(--color-border-tertiary)',paddingTop:6}}>
                          Pos. Δ column = log₁₀(Kd) correction. Positive (red) = weaker binding at this position.
                          Based on: Lau et al 2009 J Med Chem 52:1264 · Madsen et al 2007 J Med Chem 50:6126 ·
                          Kurtzhals et al 1995 Biochem J 312:725
                        </div>
                      </div>
                    )}

                    {target==='albumin'&&(
                      <div style={S.card}>
                        <span style={S.lbl}>Key determinants — HSA binding</span>
                        <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:'5px 14px',fontSize:12,lineHeight:1.7}}>
                          <span style={{color:'var(--color-text-secondary)',fontWeight:500}}>FA length</span><span>Primary driver (log-linear): C22d ≈ C20d ≥ C18d ≫ C18 &gt; C16 &gt; C14</span>
                          <span style={{color:'var(--color-text-secondary)',fontWeight:500}}>Diacid</span><span>~7× tighter via bidentate binding to HSA Sites I &amp; II</span>
                          <span style={{color:'var(--color-text-secondary)',fontWeight:500}}>γ-Glu-2×AEEA</span><span>~2× boost from optimal spacer geometry (semaglutide linker)</span>
                          <span style={{color:'var(--color-text-secondary)',fontWeight:500}}>FA position</span><span>Lys at isolated position best; cationic neighbors (K/R) weaken; non-Lys attachment penalized</span>
                        </div>
                        <div style={{fontSize:10,color:'var(--color-text-secondary)',marginTop:8}}>
                          Refs: Knudsen 2000 · Madsen 2007 J Med Chem 50:6126 · Sleep 2013 BioDrugs · Lau 2009 J Med Chem 52:1264 · Kurtzhals 1995 Biochem J 312:725
                        </div>
                      </div>
                    )}
                    {target==='membrane'&&(
                      <div style={S.card}>
                        <span style={S.lbl}>Key determinants — membrane binding</span>
                        <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:'5px 14px',fontSize:12,lineHeight:1.7}}>
                          <span style={{color:'var(--color-text-secondary)',fontWeight:500}}>μH = {muH.toFixed(3)}</span><span>{muH>0.4?'✓':'⚠'} hydrophobic moment</span>
                          <span style={{color:'var(--color-text-secondary)',fontWeight:500}}>Charge = {q74.toFixed(1)}</span><span>{q74>2?'✓':'⚠'} cationic charge for anionic membrane</span>
                          <span style={{color:'var(--color-text-secondary)',fontWeight:500}}>GRAVY = {gravy?.toFixed(3)}</span><span>{gravy!==null&&gravy>0?'Hydrophobic — favors insertion':'Hydrophilic — weaker'}</span>
                        </div>
                        <div style={{fontSize:10,color:'var(--color-text-secondary)',marginTop:8}}>
                          Refs: Eisenberg 1982 Nature 299:371 · Wieprecht 1999 Biochemistry 38:10377 · Shai 2002 Biopolymers 66:236
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ━━━ PK / STABILITY TAB ━━━ */}
            {tab==='pkstab'&&(()=>{
              if(!seq.length) return(
                <div style={{padding:16,color:'var(--color-text-secondary)',fontSize:12}}>서열을 입력하면 PK / 안정성을 분석합니다.</div>
              );

              const hasFa = Object.values(atts).flat().some(i=>i?.type==='fa');
              const firstFaItem = Object.values(atts).flat().find(i=>i?.type==='fa');
              const firstFa = firstFaItem ? FAS.find(f=>f.id===firstFaItem.id) : null;
              const faC = firstFa?.C || 0;
              const isDiacid = firstFa?.d || false;

              // albKD_sc: albumin Kd with linker correction (for t1/2 calculation)
              const albKD_sc = hasFa && firstFa ? (() => {
                const baseKD = FA_ALBUMIN_KD_uM[firstFa.id] || null;
                if(!baseKD) return null;
                const firstChain = Object.values(atts).find(ch=>ch?.some(i=>i?.id===firstFaItem.id));
                const linkerIds = (firstChain||[]).filter(i=>i?.type==='linker').map(i=>i.id);
                const hasOpt = linkerIds.some(id=>['gGlu2AEEA','gGlu2OEG','AEEA2','AEEA3','OEG2','OEG3','Ttds'].includes(id));
                const hasMed = linkerIds.some(id=>['gGluAEEA','gGluOEG','AEEA1','OEG1','PEG4'].includes(id));
                const hasShort = linkerIds.some(id=>['gGlu','GABA','betaAla','isoGlu','Ahx'].includes(id));
                let kd = baseKD;
                if(isDiacid){
                  if(linkerIds.length===0) kd*=5;
                  else if(hasShort&&!hasMed&&!hasOpt) kd*=2;
                  else if(hasMed&&!hasOpt) kd*=1.3;
                }
                return kd;
              })() : null;
              const dAACount = totalDaaCount; // includes both core + BPP D-AAs

              // ── Linker / spacer info ─────────────────────────────────
              const allLinkerItems = Object.values(atts).flat().filter(i=>i?.type==='linker');
              const hasPEGLinker = allLinkerItems.some(l=>l.id?.startsWith('PEG')||['miniPEG','miniPEG2'].includes(l.id));
              const hasGluLinker = allLinkerItems.some(l=>['gGlu','gGluAEEA','gGlu2AEEA','gGlu3AEEA','gGlu2OEG','gGluOEG','isoGlu','isoGluAEEA','isoGlu2AEEA'].includes(l.id));
              const hasAEEALinker = allLinkerItems.some(l=>['AEEA1','AEEA2','AEEA3','AEEA4','OEG1','OEG2','OEG3'].includes(l.id));
              const linkerTotalMW = allLinkerItems.reduce((s,l)=>s+(LINKERS.find(x=>x.id===l.id)?.mw||0),0);
              const effectiveMW = mw + linkerTotalMW + bppMwCalc; // includes BPP

              // ── 1. PROTEASE 취약성 분석 ─────────────────────────────
              // DPP-4: cleaves Xaa-Pro or Xaa-Ala at N-terminus (pos 2)
              // If BPP is at N-term, DPP-4 targets BPP's pos2, not core's
              let pos2, pos2isD, dpp4Note;
              if(bppSeq.length > 1 && bppPos==='nterm') {
                pos2 = bppSeq[1]?.toUpperCase();
                pos2isD = !!bppDaa[1];
              } else {
                pos2 = seq[1]?.toUpperCase();
                pos2isD = !!dAA[1];
              }
              const dpp4Risk = (!pos2isD && (pos2==='A'||pos2==='P')) ? 'HIGH' : 'LOW';
              dpp4Note = pos2isD ? `pos2=${pos2} (D-form) → DPP-4 저항`
                       : pos2==='A' ? `pos2=Ala${bppPos==='nterm'?' (BPP N-term)':''} → DPP-4 기질. Aib/D-Ala 권장`
                       : pos2==='P' ? `pos2=Pro${bppPos==='nterm'?' (BPP N-term)':''} → DPP-4 기질`
                       : `pos2=${pos2}${bppPos==='nterm'?' (BPP N-term)':''} → DPP-4 저항`;

              // Trypsin: cleaves after K, R (except followed by P) — D-AA immune
              const trypsinSites = [];
              for(let i=0;i<seq.length-1;i++){
                if(dAA[i]) continue; // D-form: not recognized by L-specific protease
                if(['K','R'].includes(seq[i].toUpperCase()) && seq[i+1]?.toUpperCase()!=='P')
                  trypsinSites.push(`${seq[i].toUpperCase()}${i+1}`);
              }

              // Chymotrypsin: cleaves after F,Y,W,L (except followed by P) — D-AA immune
              const chymoSites = [];
              for(let i=0;i<seq.length-1;i++){
                if(dAA[i]) continue;
                if(['F','Y','W','L'].includes(seq[i].toUpperCase()) && seq[i+1]?.toUpperCase()!=='P')
                  chymoSites.push(`${seq[i].toUpperCase()}${i+1}`);
              }

              // NEP (neprilysin): cleaves N-terminal side of hydrophobic residues — D-AA immune
              const nepSites = [];
              const nepAA = ['F','Y','W','L','V','I','M'];
              for(let i=1;i<seq.length;i++){
                if(dAA[i]) continue;
                if(nepAA.includes(seq[i].toUpperCase())) nepSites.push(`↓${seq[i].toUpperCase()}${i+1}`);
              }

              // C-terminal exopeptidase (carboxypeptidase A/B) — D-AA at C-term protects
              const ctermAA = seq[seq.length-1]?.toUpperCase();
              const ctermIsD = !!dAA[seq.length-1];
              const cpRisk = (!ctermIsD && ['K','R','F','Y','W','L'].includes(ctermAA)) ? 'HIGH' : 'LOW';

              // ── BPP protease sites (added to totals) ──
              for(let i=0;i<bppSeq.length-1;i++){
                if(bppDaa[i]) continue;
                if(['K','R'].includes(bppSeq[i]) && bppSeq[i+1]!=='P') trypsinSites.push(`BPP:${bppSeq[i]}${i+1}`);
                if(['F','Y','W','L'].includes(bppSeq[i]) && bppSeq[i+1]!=='P') chymoSites.push(`BPP:${bppSeq[i]}${i+1}`);
              }

              // overall protease score (0=good, higher=worse)
              let proteaseScore = 0;
              if(dpp4Risk==='HIGH') proteaseScore += 3;
              proteaseScore += Math.min(trypsinSites.length, 4);
              proteaseScore += Math.min(chymoSites.length * 0.5, 3);
              if(cpRisk==='HIGH') proteaseScore += 1;
              proteaseScore -= dAACount * 0.5; // D-AA general conformational resistance (site-specific exclusion already applied above)
              const hasCAmide_sc = cAmide; // C-terminal amide
              if(hasCAmide_sc) proteaseScore -= 1; // amide protects C-term

              const proteaseLevel = proteaseScore <= 1 ? 'GOOD' : proteaseScore <= 4 ? 'MODERATE' : 'POOR';
              const proteaseLevelCol = proteaseLevel==='GOOD'?'var(--color-text-success)':proteaseLevel==='MODERATE'?'var(--color-text-warning)':'var(--color-text-danger)';

              // ── 2. Half-life prediction ──────────────────────────────
              // Proteolytic t1/2 (in hours)
              let proteolyticH = 2/60; // baseline: 2 min (native GLP-1 in plasma)
              if(dpp4Risk==='LOW') proteolyticH *= 10;
              if(trypsinSites.length === 0) proteolyticH *= 3;
              if(dAACount > 0) proteolyticH *= (1 + dAACount * 2);
              if(hasCAmide_sc) proteolyticH *= 2;
              if(hasFa) proteolyticH *= 8;       // FA steric shield — much more than 3×
              if(hasPEGLinker) proteolyticH *= 1.5; // PEG steric protection
              if(hasGluLinker) proteolyticH *= 1.2; // charged linker minor effect

              const proteolyticFmt = proteolyticH < 1
                ? `~${Math.round(proteolyticH*60)}min`
                : proteolyticH < 24 ? `~${proteolyticH.toFixed(1)}h`
                : `~${(proteolyticH/24).toFixed(1)}d`;

              // Renal clearance t1/2 — only relevant without albumin binding (no FA)
              // GFR cutoff ~60 kDa; peptides < ~5 kDa are freely filtered
              // PEG linker expands hydrodynamic radius → reduces renal clearance
              let renalT1halfH = null;
              if (!hasFa) {
                const effMW = effectiveMW;
                renalT1halfH = effMW < 1500 ? 0.17   // ~10 min
                  : effMW < 2500 ? 0.33               // ~20 min
                  : effMW < 4000 ? 0.75               // ~45 min
                  : effMW < 6000 ? 1.5                // ~1.5h
                  : effMW < 10000 ? 3.0               // ~3h
                  : 6.0;                               // ~6h
                if(hasPEGLinker) renalT1halfH *= 2.0; // PEG hydrodynamic radius
              }

              // Albumin-based t1/2
              let albHalfLifeH = albKD_sc ? 13 * Math.pow(1.0 / albKD_sc, 0.7) : null;

              // Cleavable linker effect on half-life
              // If cleavable linker sits between peptide and FA, premature serum cleavage → FA-albumin detaches → t½ drops
              let cleavLinkerNote = '';
              if(hasFa && albHalfLifeH && cleavLinkId !== 'none') {
                if(cleavLinkId === 'ester') {
                  albHalfLifeH *= 0.7; // serum esterase partial cleavage
                  cleavLinkerNote = 'Ester linker: serum esterase에 의한 부분 절단 → t½ ×0.7';
                } else if(cleavLinkId === 'disulfide') {
                  albHalfLifeH *= 0.9; // low serum GSH but some reduction
                  cleavLinkerNote = 'Disulfide: 혈중 GSH 낮지만 소폭 절단 가능 → t½ ×0.9';
                } else if(cleavLinkId === 'hydrazone' || cleavLinkId === 'valcit' || cleavLinkId === 'gflg') {
                  cleavLinkerNote = `${cleavLinkObj.lab}: 혈중 pH 7.4에서 안정 → t½ 영향 없음`;
                }
              }

              const albHalfLifeFmt = albHalfLifeH === null ? null
                : albHalfLifeH < 1 ? `~${Math.round(albHalfLifeH*60)}min`
                : albHalfLifeH < 24 ? `~${albHalfLifeH.toFixed(1)}h`
                : albHalfLifeH < 168 ? `~${(albHalfLifeH/24).toFixed(1)}d`
                : `~${(albHalfLifeH/168).toFixed(1)}wk`;

              // Effective t1/2 — minimum of active clearance mechanisms
              const effT1halfH = (() => {
                if (hasFa && albHalfLifeH) {
                  // Albumin binding protects from renal filtration → only proteolytic vs albumin
                  return Math.min(proteolyticH, albHalfLifeH);
                }
                // No FA: renal + proteolytic compete
                const candidates = [proteolyticH];
                if (renalT1halfH) candidates.push(renalT1halfH);
                return Math.min(...candidates);
              })();

              const effHalfLifeFmt = effT1halfH < 1
                ? `~${Math.round(effT1halfH*60)}min`
                : effT1halfH < 24 ? `~${effT1halfH.toFixed(1)}h`
                : effT1halfH < 168 ? `~${(effT1halfH/24).toFixed(1)}d`
                : `~${(effT1halfH/168).toFixed(1)}wk`;

              // ── 3. SC Bioavailability & Tmax ────────────────────────
              let fPct = 70;
              if(mw > 5000) fPct -= 10;
              if(mw > 10000) fPct -= 10;
              if(hasFa && faC >= 16) fPct += 10;
              if(Math.abs(q74) > 4) fPct -= 10;
              if(gravy > 0.5) fPct -= 5;
              if(hasPEGLinker) fPct += 5; // PEG improves SC absorption
              fPct = Math.min(95, Math.max(20, fPct));

              // Tmax — based on FA chain length + linker hydrophilicity
              const tmaxH = (() => {
                if (!hasFa) return '1–4h';
                if (faC >= 20 && isDiacid) return '48–96h';
                if (faC >= 18 && isDiacid) return '24–72h';
                if (faC >= 16 && isDiacid) return '16–48h';
                if (faC >= 18) return '12–24h';
                if (faC >= 16) return '8–16h';
                if (faC >= 14) return '4–8h';
                if (faC >= 12) return '2–6h';
                return '1–4h';
              })();
              const tmaxLinkerNote = hasFa && hasPEGLinker ? ' (PEG: faster release)' : '';

              // ── 4. Renal Clearance Risk ──────────────────────────────
              const renalRisk = !hasFa && effectiveMW < 4000 ? 'HIGH'
                : !hasFa && effectiveMW < 8000 ? 'MODERATE'
                : hasFa ? 'LOW (albumin binding)' : 'MODERATE';
              const renalCol = renalRisk==='HIGH'?'var(--color-text-danger)':renalRisk.startsWith('LOW')?'var(--color-text-success)':'var(--color-text-warning)';

              // ── 5. Immunogenicity risk ───────────────────────────────
              let immunoScore = 0;
              if(dAACount > 0) immunoScore -= 2;
              if(hasCAmide_sc) immunoScore -= 1;
              if(hasPEGLinker) immunoScore -= 1; // PEG reduces immunogenicity
              let maxHydroStretch = 0, curStretch = 0;
              for(const aa of seq){
                if(gravy > 0 || 'FILMVWA'.includes(aa.toUpperCase())) curStretch++;
                else curStretch = 0;
                maxHydroStretch = Math.max(maxHydroStretch, curStretch);
              }
              if(maxHydroStretch >= 5) immunoScore += 2;
              if(seq.length > 30) immunoScore += 1;
              // BPP immunogenicity
              if(bppSeq.length > 0) {
                immunoScore += 1; // foreign sequence added
                if(['dnp2','dnp2d'].includes(bppId)) immunoScore -= 1; // human-derived → lower risk
                if(['tat','rvg29'].includes(bppId)) immunoScore += 1; // viral origin → higher risk
              }
              const immunoLevel = immunoScore <= -1 ? 'LOW' : immunoScore <= 2 ? 'MODERATE' : 'HIGH';
              const immunoCol = immunoLevel==='LOW'?'var(--color-text-success)':immunoLevel==='MODERATE'?'var(--color-text-warning)':'var(--color-text-danger)';

              // ── 6. 전반적 Drug-likeness (SC) ────────────────────────
              const dlScore = [
                dpp4Risk==='LOW' ? 2 : 0,
                trypsinSites.length===0 ? 2 : trypsinSites.length<=2 ? 1 : 0,
                hasFa ? 2 : 0,
                dAACount > 0 ? 1 : 0,
                hasCAmide_sc ? 1 : 0,
                mw > 2000 && mw < 15000 ? 1 : 0,
                albKD_sc && albKD_sc < 1.0 ? 2 : albKD_sc && albKD_sc < 5.0 ? 1 : 0,
                hasPEGLinker ? 1 : 0,
              ].reduce((a,b)=>a+b, 0);
              const dlMax = 12;
              const dlPct = Math.round(dlScore/dlMax*100);
              const dlCol = dlPct >= 70 ? 'var(--color-text-success)' : dlPct >= 45 ? 'var(--color-text-warning)' : 'var(--color-text-danger)';

              const RiskBadge = ({level, col}) => (
                <span style={{
                  padding:'1px 8px', borderRadius:99, fontSize:10, fontWeight:500,
                  background: level==='HIGH'||level==='POOR' ? 'var(--color-background-danger)'
                    : level==='LOW'||level==='GOOD' ? 'var(--color-background-success)'
                    : 'var(--color-background-warning)',
                  color: col || (level==='HIGH'||level==='POOR' ? 'var(--color-text-danger)'
                    : level==='LOW'||level==='GOOD' ? 'var(--color-text-success)'
                    : 'var(--color-text-warning)'),
                }}>{level}</span>
              );

              return(
              <div style={{padding:'12px 0',display:'flex',flexDirection:'column',gap:14}}>

                {/* 요약 스코어카드 */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
                  {[
                    {label:'Est. Half-life', val: effHalfLifeFmt, sub:`Tmax: ${tmaxH}${tmaxLinkerNote}`, col:'var(--color-text-info)',
                     tip:`Proteolytic t1/2: ${proteolyticFmt}\nAlbumin t1/2: ${albHalfLifeFmt||'no FA'}\nRenal t1/2: ${renalT1halfH?(`~${renalT1halfH<1?Math.round(renalT1halfH*60)+'min':renalT1halfH.toFixed(1)+'h'}`):'protected by albumin'}\n\nSmallest = rate-limiting step.\n★☆☆ uncertainty ±5×`},
                    {label:'SC Bioavailability', val:`~${fPct}%`, sub:`Tmax: ${tmaxH}${tmaxLinkerNote}`, col:'var(--color-text-success)',
                     tip:`Estimated SC F% based on MW, charge (pH7.4=${q74.toFixed(1)}), FA depot, PEG linker.\n\nFA (C≥16): depot → slow absorption → extended Tmax.\nPEG linker: +5% (improved SC absorption).\n★☆☆ estimate ±20%. Ref: Richter et al. 2012`},
                    {label:'Protease Resistance', val:proteaseLevel, sub:`risk score ${proteaseScore.toFixed(1)}`, col:proteaseLevelCol,
                     tip:`DPP-4, Trypsin, Chymotrypsin, Carboxypeptidase vulnerability.\n\n≤1 → GOOD\n1–4 → MODERATE\n>4 → POOR\n\nProtect with: Aib (pos2), D-AA, C-terminal amide.`},
                    {label:'Drug-likeness', val:`${dlPct}%`, sub:`${dlScore}/${dlMax} pts`, col:dlCol,
                     tip:`SC peptide drug-likeness (${dlScore}/${dlMax})\n\nItems: DPP-4(2), Trypsin(2), FA(2), D-AA(1), C-amide(1), MW(1), albumin KD(2), PEG(1)\n\nRef: semaglutide ≈ 11/12`},
                  ].map((c,i)=>(
                    <div key={i} style={{padding:'10px 12px',background:'var(--color-background-secondary)',borderRadius:'var(--border-radius-md)',textAlign:'center'}}>
                      <div style={{fontSize:10,color:'var(--color-text-secondary)',marginBottom:4,display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>
                        {c.label} <Q tip={c.tip}/>
                      </div>
                      <div style={{fontSize:18,fontWeight:500,color:c.col,fontFamily:'var(--font-mono)'}}>{c.val}</div>
                      <div style={{fontSize:10,color:'var(--color-text-secondary)',marginTop:2}}>{c.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Protease 취약성 */}
                <div style={{background:'var(--color-background-secondary)',borderRadius:'var(--border-radius-md)',padding:12}}>
                  <div style={{fontWeight:500,fontSize:11,marginBottom:8,display:'flex',alignItems:'center',gap:4}}>
                    Protease 취약성
                    <Q tip="혈중 주요 protease에 의한 분해 위험도.\nDPP-4: N-terminal Xaa-Ala/Pro 인식 분해\nTrypsin-like: K, R 후 절단\nChymotrypsin: F, Y, W, L 후 절단\nCarboxypeptidase: C-terminal 분해\n\n보호 전략: Aib(pos2), D-AA, C-terminal amide"/>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:5,fontSize:11}}>
                    {[
                      {label:'DPP-4', risk:dpp4Risk,
                       tip:dpp4Note + '\n\nRef: Mentlein 1999 Regul Pept'},
                      {label:'Trypsin', risk:trypsinSites.length===0?'LOW':trypsinSites.length<=2?'MODERATE':'HIGH',
                       tip:trypsinSites.length===0?'K/R 잔기 없음 → trypsin 절단 위치 없음'
                        :`절단 가능 위치: ${trypsinSites.join(', ')}\n\nK→Abu, K→D-Lys, R→Har(호모아르기닌) 치환으로 보호 가능`},
                      {label:'Chymotrypsin', risk:chymoSites.length===0?'LOW':chymoSites.length<=3?'MODERATE':'HIGH',
                       tip:chymoSites.length===0?'F/Y/W/L 노출 없음 → chymotrypsin 안전'
                        :`취약 위치: ${chymoSites.slice(0,6).join(', ')}\n\nα-methyl AA 또는 D-형 치환으로 보호`},
                      {label:'C-terminal', risk:hasCAmide_sc?'LOW':cpRisk,
                       tip:hasCAmide_sc?'C-terminal amide → carboxypeptidase 완전 보호'
                        :`C-term ${ctermAA} → carboxypeptidase 취약\n\nC-terminal amide(-NH₂) 처리 강력 권장`},
                    ].map((r,i)=>(
                      <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={{width:100,color:'var(--color-text-secondary)',flexShrink:0}}>{r.label}</span>
                        <RiskBadge level={r.risk}/>
                        <Q tip={r.tip}/>
                      </div>
                    ))}
                    {dAACount>0&&(
                      <div style={{display:'flex',alignItems:'center',gap:8,marginTop:2,paddingTop:4,borderTop:'0.5px solid var(--color-border-tertiary)'}}>
                        <span style={{width:100,color:'var(--color-text-secondary)',flexShrink:0}}>D-AA 보호</span>
                        <RiskBadge level='LOW'/>
                        <Q tip={`D-아미노산 ${dAACount}개 포함\n→ L-specific protease에 저항\n→ IC50 영향 없이 안정성 향상\n\nRef: Tugyi et al. 2005 PNAS`}/>
                        <span style={{fontSize:10,color:'var(--color-text-success)'}}>D-AA {dAACount}개</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 반감기 분해 */}
                <div style={{background:'var(--color-background-secondary)',borderRadius:'var(--border-radius-md)',padding:12}}>
                  <div style={{fontWeight:500,fontSize:11,marginBottom:8,display:'flex',alignItems:'center',gap:4}}>
                    Half-life Prediction (plasma)
                    <Q tip="After SC dosing, plasma half-life is determined by the fastest clearance mechanism.

Formula:
Proteolytic: DPP-4/Trypsin risk + D-AA protection
Renal: MW-based GFR filtration (no albumin binding)
Albumin: t1/2 = 13h × (1µM/Kd)^0.7
(calibrated: liraglutide 13h, semaglutide ~115h)"/>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:6,fontSize:11}}>
                    {[
                      {k:'Proteolytic t1/2', v:proteolyticFmt, col:'var(--color-text-warning)',
                       tip:`DPP-4, Trypsin, Chymotrypsin risk + D-AA/PEG/FA protection combined.\n\nBaseline: native GLP-1 ~2 min\nDPP-4 safe →×10, D-AA →×(1+n×2), FA →×8, PEG →×1.5\nRef: Mentlein 1999 · Tugyi 2005\n★☆☆ high uncertainty`},
                      {k:'Albumin t1/2', v:albHalfLifeFmt||'no FA', col:hasFa?'var(--color-text-success)':'var(--color-text-secondary)',
                       tip:albKD_sc?`albumin KD ≈ ${albKD_sc<0.001?(albKD_sc*1000).toFixed(1)+'nM':albKD_sc<1?(albKD_sc*1000).toFixed(0)+'nM':albKD_sc.toFixed(2)+'µM'}\n\nt1/2(h) = 13h × (1µM/KD)^0.7\nCalibrated: liraglutide KD~1µM→13h, semaglutide KD~0.05µM→~115h\n\nLinker type affects KD: diacid + AEEA×2/OEG×2 optimal${cleavLinkerNote?'\n\nCleavable linker: '+cleavLinkerNote:''}\nRef: Kurtzhals 1995, Lau 2015\n★★☆`:'No FA → no albumin binding → renal clearance dominates'},
                      {k:'Renal t1/2', v:renalT1halfH?(renalT1halfH<1?`~${Math.round(renalT1halfH*60)}min`:`~${renalT1halfH.toFixed(1)}h`):'N/A (albumin)', col:renalT1halfH?'var(--color-text-danger)':'var(--color-text-secondary)',
                       tip:`GFR-based renal clearance (no FA / no albumin binding)\n\nMW ${effectiveMW.toFixed(0)} Da → ${renalT1halfH?`renal t1/2 ${renalT1halfH<1?Math.round(renalT1halfH*60)+'min':renalT1halfH.toFixed(1)+'h'}`:'protected by albumin binding'}\nPEG linker: ×2.0 (expanded hydrodynamic radius)\n\nRef: glomerular filtration cutoff ~60 kDa`},
                      {k:'Effective t1/2', v:effHalfLifeFmt, col:'var(--color-text-info)',
                       tip:'Minimum of all active clearance mechanisms = rate-limiting step.\n\nTo extend half-life: lengthen BOTH albumin t1/2 (longer FA) AND proteolytic t1/2 (D-AA, C-amide).\n\nUncertainty: ±5×'},
                    ].map((r,i)=>(
                      <div key={i} style={{
                        display:'flex',alignItems:'center',gap:8,
                        paddingTop: i===2?5:0,
                        borderTop: i===3?'0.5px solid var(--color-border-tertiary)':undefined,
                        marginTop: i===2?2:0,
                      }}>
                        <span style={{width:120,color: i===3?'var(--color-text-primary)':'var(--color-text-secondary)',fontWeight:i===3?500:400,flexShrink:0}}>{r.k}</span>
                        <span style={{fontFamily:'var(--font-mono)',fontWeight:i===2?500:400,color:r.col}}>{r.v}</span>
                        <Q tip={r.tip}/>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SC PK */}
                <div style={{background:'var(--color-background-secondary)',borderRadius:'var(--border-radius-md)',padding:12}}>
                  <div style={{fontWeight:500,fontSize:11,marginBottom:8,display:'flex',alignItems:'center',gap:4}}>
                    SC PK 파라미터
                    <Q tip="피하주사(SC) 투여 시 예상 PK 특성.\n모두 서열/FA 기반 추정값이며 실제 동물 실험으로 확인 필요.\nRef: Richter et al. 2012 · ICH S6(R1)"/>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:5,fontSize:11}}>
                    {[
                      {k:'SC F%', v:`~${fPct}%`,
                       tip:`Estimated SC bioavailability (MW, charge, FA depot, PEG linker).\n\nMW=${mw.toFixed(0)} Da, charge=${q74.toFixed(1)}, FA=${hasFa?firstFa?.lab:'none'}\n\nBaseline: 70%\nFA (C≥16): +10% (depot)\nCharge |q|>4: −10%\nGRAVY>0.5: −5%\nPEG linker: +5%\n\n★☆☆ estimate ±20%`},
                      {k:'Tmax', v:`${tmaxH}${tmaxLinkerNote}`,
                       tip:`Time to peak plasma concentration after SC injection.\n\nFA chain length determines depot release rate:\nC12–14: 2–6h, C16 monoacid: 8–16h, C18 monoacid: 12–24h\nC16d diacid: 16–48h, C18d (semaglutide): 24–72h, C20d (tirzepatide): 48–96h\nPEG linker → more hydrophilic → faster release (shorter Tmax)\n\nliraglutide (C16): Tmax ~8h · semaglutide (C18d): Tmax ~72h`},
                      {k:'Renal Clearance Risk', v:renalRisk, col:renalCol,
                       tip:`GFR-based filtration risk. MW ${effectiveMW.toFixed(0)} Da (incl. linker).\n\n< 4 kDa, no FA → HIGH (rapid filtration)\n< 8 kDa, no FA → MODERATE\nWith FA (albumin binding) → LOW\nPEG linker: expands hydrodynamic radius → reduces filtration\n\nRef: GFR cutoff ~60 kDa`},
                      {k:'Immunogenicity Risk', v:immunoLevel, col:immunoCol,
                       tip:`Based on D-AA, C-amide, PEG linker, hydrophobic stretches.\n\nReducers: D-AA (−2 each), C-amide (−1), PEG linker (−1)\nIncreasers: hydrophobic stretch ≥5 (+2), length >30aa (+1)\n\n★☆☆ structural estimate only — requires in vivo confirmation`},
                    ].map((r,i)=>(
                      <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={{width:120,color:'var(--color-text-secondary)',flexShrink:0}}>{r.k}</span>
                        <span style={{fontFamily:'var(--font-mono)',color:r.col||'var(--color-text-primary)'}}>{r.v}</span>
                        <Q tip={r.tip}/>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 개선 제안 */}
                {(dpp4Risk==='HIGH'||trypsinSites.length>2||!hasFa)&&(
                  <div style={{padding:10,background:'var(--color-background-warning)',border:'0.5px solid var(--color-border-warning)',borderRadius:'var(--border-radius-md)',fontSize:11}}>
                    <div style={{fontWeight:500,color:'var(--color-text-warning)',marginBottom:4}}>💡 Drug-likeness 개선 제안</div>
                    {dpp4Risk==='HIGH'&&<div>· pos2={pos2} → <b>Aib</b> 또는 <b>D-Ala</b> 치환으로 DPP-4 저항 확보 (semaglutide Aib8 방식)</div>}
                    {trypsinSites.length>2&&<div>· Trypsin 취약 위치({trypsinSites.slice(0,3).join(', ')}) → K→D-Lys, R→Abu, 또는 D-AA 치환</div>}
                    {!hasFa&&<div>· FA 없음 → C16 또는 C18d + γGlu-2×OEG/AEEA 추가로 반감기 대폭 연장 권장</div>}
                    {!cAmide&&<div>· C-terminal free acid → amide(-NH₂) 처리로 carboxypeptidase 보호</div>}
                  </div>
                )}

              </div>);
            })()}
            {tab==='formulation'&&(()=>{
              if(!seq.length) return(
                <div style={{padding:16,color:'var(--color-text-secondary)',fontSize:12}}>
                  Enter a sequence to get SC injection formulation recommendations.
                </div>
              );

              // ── Key properties ──
              const hasFa = Object.values(atts).flat().some(i=>i?.type==='fa');
              const faItems = Object.values(atts).flat().filter(i=>i?.type==='fa');
              const firstFa = faItems[0] ? FAS.find(f=>f.id===faItems[0].id) : null;
              const isDiacid = firstFa?.d || false;
              const faC = firstFa?.C || 0;

              // Linker / spacer analysis
              const allLnkItems = Object.values(atts).flat().filter(i=>i?.type==='linker');
              const hasChargedLinker = allLnkItems.some(l=>['gGlu','gGluAEEA','gGlu2AEEA','gGlu3AEEA','gGlu2OEG','gGluOEG','isoGlu','isoGluAEEA','isoGlu2AEEA'].includes(l.id));
              const hasPEGLnk = allLnkItems.some(l=>l.id?.startsWith('PEG')||['miniPEG','miniPEG2','AEEA1','AEEA2','AEEA3','OEG1','OEG2','OEG3'].includes(l.id));
              const hasAliphSpacer = allLnkItems.some(l=>['Ahx','Ado','Aun','GABA','betaAla','Abu'].includes(l.id));
              // Effective charge: gGlu adds −1 per unit
              const gGluCount = allLnkItems.filter(l=>['gGlu','gGluAEEA','gGlu2AEEA','gGlu3AEEA','gGlu2OEG','gGluOEG'].includes(l.id)).length;
              const linkerChargeEffect = -gGluCount; // each gGlu unit adds ~−1 charge

              // pI, GRAVY, charge (with linker charge effect)
              const pI_val = totalPi;
              const fGravy = totalGravy;
              const q = totalQ74 + linkerChargeEffect; // effective charge with linker + BPP
              const cmcRisk = hasFa && firstFa
                ? Math.pow(10, 5.5 - 0.35*faC) < 200
                : false;

              // ── pH recommendation ──
              // gGlu linker shifts effective pI lower → may shift recommended pH
              const effectivepI = pI_val ? Math.max(3.0, pI_val + linkerChargeEffect * 0.3) : null;
              let recPH, phReason;
              const pIcheck = effectivepI ?? pI_val;
              if (pIcheck >= 6.0 && pIcheck <= 8.5) {
                if (pIcheck < 7.0) {
                  recPH = '4.0 – 5.5';
                  phReason = `pI≈${pIcheck.toFixed(1)} (seq ${pI_val?.toFixed(1)}${gGluCount>0?` + ${gGluCount}×γGlu`:''}) → acidic pH for solubility`;
                } else {
                  recPH = '8.0 – 9.0';
                  phReason = `pI≈${pIcheck.toFixed(1)} → alkaline pH for solubility`;
                }
              } else if (pIcheck < 6.0) {
                recPH = hasFa ? '7.4' : '7.0 – 7.4';
                phReason = `pI≈${pIcheck.toFixed(1)}${gGluCount>0?' (γGlu lowers effective pI)':''} → anionic at pH 7.4, good solubility`;
              } else {
                recPH = hasFa ? '7.4 – 8.2' : '6.0 – 7.0';
                phReason = `pI≈${pIcheck.toFixed(1)} → cationic at physiological pH`;
              }
              if (isDiacid) { recPH = '7.4'; phReason += ' · C18d diacid: ref semaglutide pH 7.4'; }

              // ── Buffer ──
              const recBuffer = [];
              const recPHnum = parseFloat(recPH.split('–')[0].trim());
              if (recPHnum >= 6.5 && recPHnum <= 8.5) {
                recBuffer.push({ name:'Sodium phosphate', conc:'10 mM', note:'Most common SC peptide buffer. Used in semaglutide & liraglutide' });
              }
              if (recPHnum >= 5.0 && recPHnum <= 6.5) {
                recBuffer.push({ name:'Sodium acetate', conc:'10–20 mM', note:'Suitable for acidic formulations' });
              }
              if (recPHnum >= 5.5 && recPHnum <= 7.5) {
                recBuffer.push({ name:'Histidine', conc:'10–20 mM', note:'Widely used in biologics. Mild antioxidant effect' });
              }
              if (hasChargedLinker) {
                recBuffer.push({ name:'Note — γ-Glu linker', conc:'—', note:`γ-Glu/isoGlu adds −${gGluCount} charge → shifts effective pI lower. Use pH closer to 7.4 for optimal solubility` });
              }

              // ── Tonicity agent ──
              const recTonicity = [];
              if (hasFa && isDiacid) {
                recTonicity.push({ name:'Propylene glycol', conc:'14 mg/mL (1.4%)', note:'Used in semaglutide (Ozempic). Helps dissolve diacid FA peptides', ref:'Ozempic FDA label' });
              }
              if (hasPEGLnk) {
                recTonicity.push({ name:'Mannitol', conc:'36.9 mg/mL', note:'Preferred with PEG/AEEA/OEG linkers — PEG already hydrophilic, mannitol avoids extra ionic strength', ref:'ICH Q8' });
              } else {
                recTonicity.push({ name:'Mannitol', conc:'36.9 mg/mL', note:'Most stable tonicity agent. Used in liraglutide (Victoza)', ref:'Victoza FDA label' });
              }
              recTonicity.push({ name:'NaCl', conc:'6.3–9 mg/mL', note:'Simplest option. May promote aggregation for hydrophobic FA peptides' });

              // ── Surfactant ──
              const recSurf = [];
              if (cmcRisk || hasFa) {
                recSurf.push({ name:'Polysorbate 80 (Tween-80)', conc:'0.01–0.05% (v/v)', note:'Prevents FA peptide aggregation and micelle formation above CMC' });
                recSurf.push({ name:'Polysorbate 20 (Tween-20)', conc:'0.01–0.02%', note:'Alternative to Tween-80. Slightly lower oxidative stability' });
              }
              if (hasAliphSpacer && !hasFa) {
                recSurf.push({ name:'Poloxamer 188', conc:'0.05%', note:'Aliphatic spacer (Ahx/Ado) increases hydrophobicity — gentle surfactant to prevent aggregation' });
              }

              // ── Cosolvent ──
              const recCosolv = [];
              if (fGravy > 0.3) {
                recCosolv.push({ name:'Propylene glycol', conc:'5–15%', note:`GRAVY=${fGravy.toFixed(2)} → hydrophobic peptide. Improves aqueous solubility. Acceptable for SC injection` });
              }
              if (fGravy > 0.6) {
                recCosolv.push({ name:'HP-β-Cyclodextrin', conc:'5–10%', note:'Highly hydrophobic peptide. Can dramatically improve solubility by encapsulating FA tail' });
              }
              if (!hasFa && fGravy < -0.3) {
                recCosolv.push({ name:'PBS alone sufficient', conc:'—', note:`GRAVY=${fGravy.toFixed(2)} → hydrophilic, no cosolvent needed` });
              }
              if (hasPEGLnk) {
                recCosolv.push({ name:'Note — PEG/AEEA/OEG linker', conc:'—', note:'PEG-type linker already improves aqueous solubility. May reduce or eliminate need for cosolvent' });
              }

              // ── Preservative (multi-dose) ──
              const recPreserv = [
                { name:'Phenol', conc:'1.5–5 mg/mL', note:'Used in semaglutide & liraglutide. Antimicrobial + mild protein stabilization' },
                { name:'m-Cresol', conc:'2–3 mg/mL', note:'Common in insulin formulations. Alternative to phenol' },
              ];

              // ── Route of administration ──
              let recRoute;
              if (hasFa && (faC >= 16)) {
                recRoute = 'Subcutaneous (SC)';
              } else if (hasFa) {
                recRoute = 'Subcutaneous (SC) or Intramuscular (IM)';
              } else {
                recRoute = 'Intravenous (IV) or Subcutaneous (SC)';
              }

              const Section = ({title, items, note}) => (
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:11,fontWeight:500,color:'var(--color-text-secondary)',marginBottom:6,borderBottom:'0.5px solid var(--color-border-tertiary)',paddingBottom:4}}>{title}</div>
                  {items.map((it,i)=>(
                    <div key={i} style={{display:'grid',gridTemplateColumns:'180px 130px 1fr',gap:8,padding:'5px 0',borderBottom:'0.5px solid var(--color-border-tertiary)',alignItems:'start',fontSize:11}}>
                      <div style={{fontWeight:500,color:'var(--color-text-primary)'}}>{it.name}</div>
                      <div style={{fontFamily:'var(--font-mono)',color:'var(--color-text-info)'}}>{it.conc}</div>
                      <div style={{color:'var(--color-text-secondary)'}}>{it.note}{it.ref&&<span style={{marginLeft:6,fontSize:10,color:'var(--color-text-tertiary)'}}>({it.ref})</span>}</div>
                    </div>
                  ))}
                  {note&&<div style={{fontSize:10,color:'var(--color-text-secondary)',marginTop:4}}>{note}</div>}
                </div>
              );

              return(
              <div style={{padding:'12px 0'}}>
                {/* Summary */}
                <div style={{
                  padding:12,marginBottom:16,
                  background:'var(--color-background-info)',
                  border:'0.5px solid var(--color-border-info)',
                  borderRadius:'var(--border-radius-md)',
                  fontSize:11,lineHeight:1.7,
                }}>
                  <div style={{fontWeight:500,color:'var(--color-text-info)',marginBottom:4}}>SC Injection Formulation Summary</div>
                  <div>Recommended route: <b>{recRoute}</b></div>
                  <div>Recommended pH: <b>{recPH}</b> — {phReason}</div>
                  <div>pI={pI_val?.toFixed(1)} · GRAVY={fGravy?.toFixed(2)} · charge(pH7.4)={totalQ74.toFixed(1)}{gGluCount>0?` (γGlu effect: ${linkerChargeEffect})`:''} · MW={totalMw.toFixed(0)} Da{hasFa?` · FA: ${firstFa?.lab||''}`:''}{bppSeq.length?` · BPP: ${bppObj.lab}`:''}</div>
                  {(hasPEGLnk||hasChargedLinker||hasAliphSpacer)&&(
                    <div style={{marginTop:4,fontSize:10,color:'var(--color-text-info)'}}>
                      Linker effects:
                      {hasPEGLnk&&' PEG/AEEA/OEG → improved solubility, reduced immunogenicity;'}
                      {hasChargedLinker&&` γ-Glu ×${gGluCount} → −${gGluCount} charge, lower effective pI;`}
                      {hasAliphSpacer&&' aliphatic spacer → slightly increased hydrophobicity'}
                    </div>
                  )}
                </div>

                <Section title="Buffer (10 mM recommended)" items={recBuffer}
                  note="Ref: ICH Q8(R2) · Ozempic/Victoza FDA label"/>

                <Section title="Tonicity agent (~300 mOsm/L target)" items={recTonicity}
                  note="Ref: Kurtzhals et al. 1995 · Ozempic FDA label (propylene glycol) · Victoza FDA label (mannitol)"/>

                {recSurf.length>0&&<Section title="Surfactant" items={recSurf}
                  note="Prevents aggregation. Within ICH Q8 permitted concentrations"/>}

                {recCosolv.length>0&&<Section title="Cosolvent" items={recCosolv}
                  note="Estimate based on GRAVY score and linker type. Verify with actual solubility experiment"/>}

                <Section title="Preservative (multi-dose vial)" items={recPreserv}
                  note="Not required for single-use. Ref: semaglutide, liraglutide formulations"/>

                {/* Example prescription */}
                <div style={{marginTop:8,padding:12,background:'var(--color-background-secondary)',borderRadius:'var(--border-radius-md)',fontSize:11}}>
                  <div style={{fontWeight:500,marginBottom:8,color:'var(--color-text-primary)'}}>Example prescription (semaglutide-style)</div>
                  <div style={{fontFamily:'var(--font-mono)',lineHeight:2,color:'var(--color-text-secondary)'}}>
                    <div>Disodium hydrogen phosphate · 10 mM</div>
                    {isDiacid
                      ? <div>Propylene glycol · 14 mg/mL</div>
                      : <div>Mannitol · 36.9 mg/mL</div>
                    }
                    {(cmcRisk||hasFa)&&<div>Polysorbate 80 · 0.01%</div>}
                    <div>Phenol · 1.5 mg/mL (multi-dose only)</div>
                    <div>pH {recPH.split('–')[0].trim()} · q.s. with WFI (Water for Injection)</div>
                    <div>0.22 µm sterile filtration</div>
                  </div>
                </div>

                <div style={{marginTop:10,fontSize:10,color:'var(--color-text-secondary)',lineHeight:1.7}}>
                  ⚠ Recommendations are based on pI, GRAVY, FA structure, and linker type. Verify with pH-solubility profile, thermal stability, and release kinetics experiments.<br/>
                  Ref: ICH Q8(R2) · Ozempic FDA label (2017) · Victoza FDA label · Knudsen &amp; Lau, Front Endocrinol 2019
                </div>
              </div>);
            })()}

            {/* ═══ 🧠 BBB TAB ═══ */}
            {tab==='bbb'&&(()=>{
              const hasBpp = bppSeq.length > 0;
              const bppMW = bppSeq.split('').reduce((s,a)=>(AA[a]?.mw??110)-WATER+s,0)+(bppSeq.length?WATER:0);
              const totalMW = mw + bppMW;
              const cargoOk = totalMW < 10000;
              const bppTrypsin=[], bppChymo=[];
              for(let i=0;i<bppSeq.length-1;i++){
                if(bppDaa[i]) continue;
                if(['K','R'].includes(bppSeq[i]) && bppSeq[i+1]!=='P') bppTrypsin.push(`${bppSeq[i]}${i+1}`);
                if(['F','Y','W','L'].includes(bppSeq[i]) && bppSeq[i+1]!=='P') bppChymo.push(`${bppSeq[i]}${i+1}`);
              }
              let bbbScore=0, bbbLevel='NONE', bbbNotes=[];
              if(!hasBpp){ bbbLevel='NONE'; bbbNotes.push('No BPP — BBB 투과 불가 (peptide >500 Da)'); }
              else {
                bbbScore = bppObj.rating || 1;
                if(bppNdaa>0 && bppObj.id==='ang2') bbbNotes.push('⚠ Angiopep-2 D-AA 시 LRP-1 결합 소실 위험 — L-form 권장');
                if(bppObj.adWarning) bbbNotes.push('⚠ '+bppObj.adWarning);
                if(!cargoOk){bbbScore-=1;bbbNotes.push(`Total ${(totalMW/1000).toFixed(1)} kDa >10 kDa — transcytosis 효율↓`);}
                else bbbNotes.push(`Total ${(totalMW/1000).toFixed(1)} kDa — transcytosis 가능 범위`);
                bbbLevel=bbbScore>=4?'HIGH':bbbScore>=2?'MODERATE':'LOW';
              }
              const bbbCol=bbbLevel==='HIGH'?'var(--color-text-success)':bbbLevel==='MODERATE'?'var(--color-text-warning)':bbbLevel==='NONE'?'var(--color-text-secondary)':'var(--color-text-danger)';
              const R={display:'flex',gap:12,padding:'6px 0',borderBottom:'0.5px solid var(--color-border-tertiary)',fontSize:12};
              const K={color:'var(--color-text-secondary)',minWidth:130,fontSize:11};
              const V={fontWeight:500,color:'var(--color-text-primary)'};
              const Sec={fontSize:13,fontWeight:600,color:'var(--color-text-primary)',marginTop:14,marginBottom:6};
              const Card={padding:14,borderRadius:'var(--border-radius-md)',background:'var(--color-background-secondary)',marginBottom:8};
              return(<div>
                <div style={Card}>
                  <div style={{fontSize:11,color:'var(--color-text-secondary)',marginBottom:6}}>BBB Permeability Assessment</div>
                  <div style={{display:'flex',gap:16,alignItems:'center'}}>
                    <span style={{fontSize:28,fontWeight:700,color:bbbCol}}>{bbbLevel}</span>
                    <div>{hasBpp?(<>
                      <div style={{fontSize:13,fontWeight:500}}>{bppObj.lab} · {bppObj.mechanism}</div>
                      <div style={{fontSize:11,color:'var(--color-text-secondary)'}}>Receptor: {bppObj.receptor} · Brain uptake: {bppObj.brainUptake}</div>
                      <div style={{fontSize:11,color:'var(--color-text-secondary)'}}>Clinical: {bppObj.clinical}</div>
                    </>):(<div style={{fontSize:13,color:'var(--color-text-secondary)'}}>좌측 패널에서 BPP를 선택하세요</div>)}</div>
                  </div>
                </div>
                {hasBpp&&(<>
                  <div style={Card}>
                    <div style={Sec}>BPP 상세</div>
                    <div style={R}><span style={K}>서열</span><span style={{...V,fontFamily:'var(--font-mono)',fontSize:11,wordBreak:'break-all'}}>{bppSeq}</span></div>
                    <div style={R}><span style={K}>길이 / MW</span><span style={V}>{bppSeq.length} aa / {bppMW.toFixed(0)} Da</span></div>
                    <div style={R}><span style={K}>부착 위치</span><span style={V}>{bppPos==='nterm'?'N-term':bppPos==='cterm'?'C-term':`Branch: ${seq[parseInt(bppPos.slice(1))]||''}${parseInt(bppPos.slice(1))+1} (Lys side chain)`}</span></div>
                    <div style={R}><span style={K}>D-AA</span><span style={V}>{bppNdaa}개 / {bppSeq.length}개{bppRetroInverso&&<span style={{color:'#7c3aed',marginLeft:6}}>★ Retro-inverso</span>}</span></div>
                    <div style={R}><span style={K}>BPP Protease sites</span>
                      <span style={{...V,fontSize:11}}>Trypsin: {bppTrypsin.length||0} ({bppTrypsin.join(', ')||'—'}) · Chymo: {bppChymo.length||0} ({bppChymo.join(', ')||'—'})</span></div>
                    {bppObj.notes&&<div style={{fontSize:10,color:'var(--color-text-secondary)',marginTop:6}}>💡 {bppObj.notes}</div>}
                  </div>
                  <div style={Card}>
                    <div style={Sec}>Construct 구조</div>
                    <div style={{fontFamily:'var(--font-mono)',fontSize:12,padding:10,background:'var(--color-background-primary)',
                      borderRadius:'var(--border-radius-sm)',lineHeight:2,wordBreak:'break-all'}}>
                      {bppPos==='nterm'?(
                        <><span style={{color:'#8b5cf6',fontWeight:600}}>[{bppObj.lab}]</span>
                        {cleavLinkObj.id!=='none'&&<span style={{color:'var(--color-text-danger)'}}> —[{cleavLinkObj.lab}]— </span>}
                        <span style={{color:'var(--color-text-secondary)'}}> — </span>
                        <span style={{color:'var(--color-text-info)',fontWeight:600}}>[Peptide {seq.length}aa]</span>
                        <span style={{color:'var(--color-text-secondary)'}}> — [Linker] — [FA]</span>
                        <span style={{color:'var(--color-text-warning)'}}> ···(Albumin)</span></>
                      ):(
                        <><span style={{color:'var(--color-text-info)',fontWeight:600}}>[Peptide {seq.length}aa]</span>
                        {cleavLinkObj.id!=='none'&&<span style={{color:'var(--color-text-danger)'}}> —[{cleavLinkObj.lab}]— </span>}
                        <span style={{color:'var(--color-text-secondary)'}}> — </span>
                        <span style={{color:'#8b5cf6',fontWeight:600}}>[{bppObj.lab}]</span>
                        <br/><span style={{color:'var(--color-text-secondary)'}}>{'  '}└─ [Linker] — [FA]</span>
                        <span style={{color:'var(--color-text-warning)'}}> ···(Albumin)</span></>
                      )}
                    </div>
                    <div style={{fontSize:11,marginTop:8}}>Total MW: <b>{(totalMW/1000).toFixed(1)} kDa</b></div>
                  </div>
                  <div style={Card}>
                    <div style={Sec}>Cleavable Linker</div>
                    <div style={R}><span style={K}>종류</span><span style={V}>{cleavLinkObj.lab}</span></div>
                    <div style={R}><span style={K}>절단 조건</span><span style={V}>pH {cleavLinkObj.cleavagePH}</span></div>
                    <div style={R}><span style={K}>Endosome 반감기</span><span style={V}>{cleavLinkObj.halfLife}</span></div>
                    <div style={R}><span style={K}>혈중 안정성</span><span style={V}>{cleavLinkObj.serumStab}</span></div>
                    <div style={R}><span style={K}>메커니즘</span><span style={{...V,fontSize:11}}>{cleavLinkObj.mechanism}</span></div>
                    {cleavLinkObj.notes&&<div style={{fontSize:10,color:'var(--color-text-secondary)',marginTop:6}}>💡 {cleavLinkObj.notes}</div>}
                  </div>
                  {bbbNotes.filter(Boolean).length>0&&<div style={Card}>
                    <div style={Sec}>Notes & Warnings</div>
                    {bbbNotes.filter(Boolean).map((n,i)=><div key={i} style={{fontSize:11,color:n.startsWith('⚠')?'var(--color-text-warning)':'var(--color-text-secondary)',lineHeight:1.6,marginBottom:4}}>{n}</div>)}
                  </div>}
                </>)}
                <div style={{fontSize:10,color:'var(--color-text-secondary)',lineHeight:1.6,marginTop:8}}>
                  Ref: Demeule et al. JPET 2008 · Lim et al. Nat Commun 2015 · Oller-Salvia et al. Chem Soc Rev 2016
                </div>
              </div>);
            })()}


            {/* ═══ 🔍 AUTO-OPTIMIZE TAB ═══ */}
            {tab==='optimize'&&(
              <div>
                <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>🔍 Auto-optimization — Top 5 추천</div>
                <div style={{fontSize:11,color:'var(--color-text-secondary)',marginBottom:12}}>
                  Peptide 서열 기반으로 BPP × 위치 × FA × Cleavable 조합을 자동 탐색합니다.
                </div>
                <div style={{background:'var(--color-background-secondary)',borderRadius:8,padding:12,marginBottom:12}}>
                  <div style={{fontSize:11,fontWeight:600,marginBottom:8}}>가중치 조절</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                    {[
                      {k:'bbb',label:'🧠 BBB 투과',color:'#7c3aed'},
                      {k:'binding',label:'◎ Binding (결합력)',color:'#059669'},
                      {k:'albKd',label:'💉 Albumin Kd',color:'#d97706'},
                      {k:'halfLife',label:'⏱ Half-life',color:'#2563eb'},
                      {k:'protease',label:'🛡 Protease 저항',color:'#dc2626'},
                      {k:'drugLike',label:'💊 Drug-likeness',color:'#6366f1'},
                      {k:'immuno',label:'🔻 면역원성 (↓)',color:'#9333ea'},
                    ].map(w=>(
                      <div key={w.k} style={{display:'flex',alignItems:'center',gap:6}}>
                        <span style={{fontSize:10,minWidth:110,color:w.color}}>{w.label}</span>
                        <input type="range" min="0" max="5" value={optWeights[w.k]}
                          onChange={e=>setOptWeights(p=>({...p,[w.k]:parseInt(e.target.value)}))}
                          style={{flex:1,accentColor:w.color}}/>
                        <span style={{fontSize:10,fontWeight:600,minWidth:12,color:w.color}}>{optWeights[w.k]}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{display:'flex',gap:6,marginTop:8,flexWrap:'wrap'}}>
                    <button onClick={()=>setOptWeights({bbb:3,binding:3,albKd:2,halfLife:2,protease:2,drugLike:1,immuno:1})}
                      style={{fontSize:10,padding:'3px 8px',cursor:'pointer',border:'1px solid var(--color-border-secondary)',borderRadius:4,background:'var(--color-background-primary)',color:'var(--color-text-secondary)'}}>기본값</button>
                    <button onClick={()=>setOptWeights({bbb:5,binding:2,albKd:1,halfLife:3,protease:2,drugLike:1,immuno:1})}
                      style={{fontSize:10,padding:'3px 8px',cursor:'pointer',border:'1px solid #7c3aed',borderRadius:4,background:'#faf5ff',color:'#7c3aed'}}>BBB 우선</button>
                    <button onClick={()=>setOptWeights({bbb:1,binding:5,albKd:3,halfLife:3,protease:1,drugLike:1,immuno:1})}
                      style={{fontSize:10,padding:'3px 8px',cursor:'pointer',border:'1px solid #059669',borderRadius:4,background:'#f0fdf4',color:'#059669'}}>결합력 우선</button>
                    <button onClick={()=>setOptWeights({bbb:2,binding:2,albKd:2,halfLife:5,protease:3,drugLike:2,immuno:1})}
                      style={{fontSize:10,padding:'3px 8px',cursor:'pointer',border:'1px solid #2563eb',borderRadius:4,background:'#eff6ff',color:'#2563eb'}}>안정성 우선</button>
                  </div>
                </div>

                {(()=>{
                  if(!seq.length) return <div style={{textAlign:'center',padding:20,color:'var(--color-text-secondary)'}}>펩타이드 서열을 먼저 입력해주세요</div>;
                  const BPP_OPT=[
                    {id:'none',lab:'No BPP',bbbS:0,immunoAdd:0},
                    {id:'ang2',lab:'Angiopep-2',bbbS:9,immunoAdd:0},
                    {id:'ang2ri',lab:'Ang2 retro-inverso',bbbS:8,immunoAdd:-1},
                    {id:'dnp2',lab:'dNP2',bbbS:6,immunoAdd:-1},
                    {id:'rvg29',lab:'RVG-29',bbbS:5,immunoAdd:1},
                  ];
                  const POS_OPT=['nterm','cterm',...[...seq].map((a,i)=>a==='K'?`K${i+1}`:null).filter(Boolean)];
                  const FA_OPT=[
                    {id:'none',lab:'No FA',albS:0},
                    {id:'C16',lab:'C16',albS:3},
                    {id:'C18d',lab:'C18 diacid',albS:9},
                    {id:'C20d',lab:'C20 diacid',albS:10},
                  ];
                  const CL_OPT=[
                    {id:'none',lab:'None',serumPen:1.0,clS:0},
                    {id:'hydrazone',lab:'Hydrazone',serumPen:1.0,clS:2},
                    {id:'valcit',lab:'Val-Cit',serumPen:1.0,clS:2},
                  ];
                  const W=optWeights, results=[];
                  for(const bpp of BPP_OPT){
                    const bpList=bpp.id==='none'?['none']:POS_OPT;
                    for(const bp of bpList){
                      for(const fa of FA_OPT){
                        const fpList=fa.id==='none'?['none']:POS_OPT.filter(p=>p!==bp);
                        for(const fp of fpList){
                          for(const cl of CL_OPT){
                            if(cl.id!=='none'&&fa.id==='none') continue; // cleavable without FA meaningless
                            const bpI=bp==='nterm'?0:bp==='cterm'?seq.length-1:bp==='none'?-1:parseInt(bp.slice(1))-1;
                            const fpI=fp==='nterm'?0:fp==='cterm'?seq.length-1:fp==='none'?-1:parseInt(fp.slice(1))-1;
                            // ═══ ALL SCORES 0-10 ═══
                            // BBB (0-10)
                            let bbbS = bpp.bbbS;
                            if(bpI>=0){ const rp=bpI/Math.max(seq.length-1,1); bbbS *= rp>0.8?1.0:rp>0.6?0.95:rp>0.3?0.85:0.7; }
                            // IC50 (0-10)
                            let bindingS = 7;
                            if(bpI>=0){
                              if(structData?.pepDistToTarget){ const d3d=structData.pepDistToTarget.find(r=>r.resn===(bpI+1))?.dist||20; bindingS += d3d<6?-4:d3d<10?-2.5:d3d<15?-1:0; }
                              else { bindingS += bpI<3?-4:bpI<8?-2.5:bpI<15?-1:0; }
                            }
                            if(fpI===0&&structData?.hydroContacts?.some(h=>h.pepResn<=3)) bindingS+=2;
                            else if(fpI>=0&&fpI<5&&!structData) bindingS-=1;
                            bindingS=Math.max(0,Math.min(10,bindingS));
                            // Albumin (0-10)
                            let albS = fa.albS;
                            if(bpI>=0&&fpI>=0){ const d=Math.abs(bpI-fpI); albS*=d===0?0.1:d<=2?0.3:d<=5?0.6:d<=8?0.85:1.0; }
                            // Half-life (0-10)
                            const faHlM={none:1,C16:5,C18d:8,C20d:9};
                            let hlS=(faHlM[fa.id]||1); if(cl.id==='ester') hlS*=0.7;
                            // Brain (0-10)
                            let brainS=fa.id==='none'?8:cl.id==='hydrazone'?9:cl.id==='valcit'?8:cl.id!=='none'?7:3;
                            // Protease (0-10)
                            let protS=3; if(bpp.id.includes('ri')) protS+=3; protS+=Math.min(nDAA*0.8,3)+Math.min(nnAAProtR,2); if(cAmide) protS+=1; protS=Math.min(10,protS);
                            // Drug-likeness (0-10)
                            let dlS=2; if(fa.id!=='none') dlS+=2; if(bpp.id!=='none') dlS+=1.5; if(cl.id!=='none'&&fa.id!=='none') dlS+=1.5; if(nDAA>0) dlS+=1; if(cAmide) dlS+=0.5; dlS=Math.min(10,dlS);
                            // Immunogenicity (0-10, higher=less immunogenic)
                            let immunoS=7; if(bpp.id!=='none') immunoS-=1.5; immunoS-=bpp.immunoAdd; if(nDAA>0) immunoS+=1.5; if(bpp.id.includes('ri')) immunoS+=1; immunoS=Math.max(0,Math.min(10,immunoS));
                            // Synergy
                            let syn=0;
                            if(bpI>seq.length*0.8&&fpI>=0&&fpI<seq.length*0.7&&fpI>5) syn+=3;
                            if(cl.id!=='none'&&fa.id!=='none'&&bpp.id!=='none') syn+=2;
                            // TOTAL
                            const score=(W.bbb*bbbS+W.binding*bindingS+W.albKd*albS+W.halfLife*hlS+W.protease*protS+W.drugLike*(dlS*0.7+brainS*0.3)+W.immuno*immunoS+syn)/10;
                            results.push({bpp:bpp.lab,bp,fa:fa.lab,fp,cl:cl.lab,score:Math.round(score*100)/100,
                              bbbS:Math.round(bbbS),bindingS:Math.round(bindingS),albS:Math.round(albS),hlS:Math.round(hlS),
                              albPen:bpI>=0&&fpI>=0?Math.abs(bpI-fpI):-1,brainS:Math.round(brainS)});
                          }
                        }
                      }
                    }
                  }
                  results.sort((a,b)=>b.score-a.score);
                  const top5=results.slice(0,5);
                  return(
                    <div>
                      <div style={{fontSize:10,color:'var(--color-text-secondary)',marginBottom:8}}>
                        탐색: {results.length}개 조합 → 상위 5개
                      </div>
                      <div style={{overflowX:'auto'}}>
                        <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                          <thead><tr style={{borderBottom:'2px solid var(--color-border-secondary)',fontSize:10,color:'var(--color-text-secondary)'}}>
                            <th style={{padding:5,textAlign:'left'}}>#</th>
                            <th style={{padding:5,textAlign:'left'}}>BPP</th>
                            <th style={{padding:5}}>BPP pos</th>
                            <th style={{padding:5,textAlign:'left'}}>FA</th>
                            <th style={{padding:5}}>FA pos</th>
                            <th style={{padding:5}}>Cleavable</th>
                            <th style={{padding:5,textAlign:'right'}}>Score</th>
                            <th style={{padding:5}}>BBB</th>
                            <th style={{padding:5}}>IC50</th>
                            <th style={{padding:5}}>Alb</th>
                            <th style={{padding:5}}>t½</th>
                            <th style={{padding:5}}>Brain</th>
                          </tr></thead>
                          <tbody>
                            {top5.map((r,i)=>(
                              <tr key={i} style={{borderBottom:'0.5px solid var(--color-border-tertiary)',
                                background:i===0?'var(--color-background-success)':'transparent'}}>
                                <td style={{padding:5,fontWeight:700,color:i===0?'var(--color-text-success)':'var(--color-text-primary)'}}>{i===0?'🏆':i+1}</td>
                                <td style={{padding:5,fontFamily:'var(--font-mono)',fontSize:10}}>{r.bpp}</td>
                                <td style={{padding:5,textAlign:'center',fontFamily:'var(--font-mono)',fontSize:10,color:'var(--color-text-info)'}}>{r.bp==='none'?'—':r.bp}</td>
                                <td style={{padding:5,fontFamily:'var(--font-mono)',fontSize:10}}>{r.fa}</td>
                                <td style={{padding:5,textAlign:'center',fontFamily:'var(--font-mono)',fontSize:10,color:'#d97706'}}>{r.fp==='none'?'—':r.fp}</td>
                                <td style={{padding:5,textAlign:'center',fontSize:10,color:r.cl!=='None'?'#7c3aed':'var(--color-text-secondary)'}}>{r.cl}</td>
                                <td style={{padding:5,textAlign:'right',fontWeight:600,fontFamily:'var(--font-mono)',
                                  color:i===0?'var(--color-text-success)':'var(--color-text-primary)'}}>{r.score.toFixed(1)}</td>
                                <td style={{padding:5,textAlign:'center',fontSize:10}}>{r.bbbS}</td>
                                <td style={{padding:5,textAlign:'center',fontSize:10}}>{(r.bindingS*10).toFixed(0)}</td>
                                <td style={{padding:5,textAlign:'center',fontSize:10,color:r.albPen<1?'var(--color-text-danger)':'inherit'}}>
                                  {(r.albS*10).toFixed(0)}{r.albPen<1?'⚠':''}
                                </td>
                                <td style={{padding:5,textAlign:'center',fontSize:10}}>{r.hlS}</td>
                                <td style={{padding:5,textAlign:'center',fontSize:10,color:r.brainS>=8?'var(--color-text-success)':r.brainS<=4?'var(--color-text-danger)':'inherit'}}>{r.brainS}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {top5.length>0&&(
                        <div style={{marginTop:12,padding:10,background:'#f0fdf4',borderRadius:6,border:'1px solid #86efac'}}>
                          <div style={{fontSize:11,fontWeight:600,color:'#15803d',marginBottom:6}}>🏆 추천 구조:</div>
                          <div style={{fontSize:12,fontFamily:'var(--font-mono)',color:'#15803d',lineHeight:1.8}}>
                            {top5[0].bpp!=='No BPP'?`[${top5[0].bpp}]—`:''}{top5[0].bp!=='none'?`(${top5[0].bp}) `:''} 
                            [Peptide]
                            {top5[0].fp!=='none'?`—${top5[0].fp}(`:''}{top5[0].cl!=='None'?`[${top5[0].cl}]→`:''}
                            {top5[0].fa!=='No FA'?`[${top5[0].fa}]`:''}
                            {top5[0].fp!=='none'?')':''}···Albumin
                          </div>
                        </div>
                      )}
                      <div style={{fontSize:10,color:'var(--color-text-secondary)',marginTop:8}}>
                        {structData?'📐 구조 데이터 반영됨':'구조 파일 업로드 시 hydrophobic contact 기반 IC50 보정 적용'}
                        · 가중치 슬라이더로 우선순위 변경 가능
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
