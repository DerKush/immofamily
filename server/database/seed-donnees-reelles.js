/**
 * Données réelles des immeubles : Marcory, Dokui, Yopougon
 * Exécuté une seule fois au démarrage (vérification par nom unique)
 */
const db = require('./pool');

async function seedDonneesReelles() {
  // Vérification : ne pas réinsérer si déjà présent
  const existe = await db.queryOne(
    "SELECT id FROM biens WHERE nom = 'Immeuble Marcory Zone 4' AND type = 'Immeuble'"
  );
  if (existe) {
    console.log('📦 Données réelles déjà présentes.');
    return;
  }

  console.log('🏢 Insertion des données réelles (Marcory, Dokui, Yopougon)…');

  const b = async (vals) => {
    const r = await db.query(`
      INSERT INTO biens (nom, quartier, type, superficie, loyer, statut, latitude, longitude, description, parent_id, adresse)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`, vals);
    return r.rows[0].id;
  };

  const l = async (nom, bienId, telephone = null) => {
    const r = await db.query(`
      INSERT INTO locataires (nom, telephone, bien_id, date_entree)
      VALUES ($1,$2,$3,'2025-01-01') RETURNING id`, [nom, telephone, bienId]);
    return r.rows[0].id;
  };

  // Marque bien comme occupé
  const occ = (id) => db.query("UPDATE biens SET statut='occupe' WHERE id=$1", [id]);

  // Insère un paiement
  const pay = (locId, bienId, montant, statut, mois, annee, dateP = null) =>
    db.query(`INSERT INTO paiements (locataire_id, bien_id, montant, date_paiement, mode, statut, mois, annee)
              VALUES ($1,$2,$3,$4,'Espèces',$5,$6,$7)`,
             [locId, bienId, montant, dateP, statut, mois, annee]);

  // ── MARCORY ──────────────────────────────────────────────────────────────
  const marcory = await b([
    'Immeuble Marcory Zone 4', 'Marcory', 'Immeuble',
    null, 0, 'occupe', 5.2938, -3.9941,
    'Deux bâtiments (A et B) R+1 + Studios et magasins extérieurs.',
    null, 'Zone 4, Marcory, Abidjan',
  ]);

  // Batiment A – RDC
  const mA_RDC_1 = await b(['Bat A RDC – REINE',  'Marcory','Appartement',null,55000,'occupe',null,null,'Bat A RDC',marcory,null]); await occ(mA_RDC_1);
  const mA_RDC_2 = await b(['Bat A RDC – NADINE', 'Marcory','Appartement',null,55000,'occupe',null,null,'Bat A RDC',marcory,null]); await occ(mA_RDC_2);
  const mA_RDC_3 = await b(['Bat A RDC – ADAMA',  'Marcory','Appartement',null,55000,'occupe',null,null,'Bat A RDC',marcory,null]); await occ(mA_RDC_3);
  const mA_RDC_4 = await b(['Bat A RDC – AMADOU (Vendeur Journeaux)', 'Marcory','Appartement',null,50000,'occupe',null,null,'Bat A RDC',marcory,null]); await occ(mA_RDC_4);
  const mA_RDC_5 = await b(['Bat A RDC – ROSE',   'Marcory','Appartement',null,60000,'occupe',null,null,'Bat A RDC',marcory,null]); await occ(mA_RDC_5);

  // Batiment A – 1er Etage
  const mA_1_1 = await b(['Bat A 1er – KOUADIO FREDERIC', 'Marcory','Appartement',null,30000,'occupe',null,null,'Bat A 1er',marcory,null]); await occ(mA_1_1);
  const mA_1_2 = await b(['Bat A 1er – ERIC',             'Marcory','Appartement',null,55000,'occupe',null,null,'Bat A 1er',marcory,null]); await occ(mA_1_2);
  const mA_1_3 = await b(['Bat A 1er – ABIBA',            'Marcory','Appartement',null,55000,'occupe',null,null,'Bat A 1er',marcory,null]); await occ(mA_1_3);
  const mA_1_4 = await b(['Bat A 1er – ZEKRE CHRISTELLE', 'Marcory','Appartement',null,55000,'occupe',null,null,'Bat A 1er',marcory,null]); await occ(mA_1_4);
  const mA_1_5 = await b(['Bat A 1er – DESIREE',          'Marcory','Appartement',null,55000,'occupe',null,null,'Bat A 1er',marcory,null]); await occ(mA_1_5);
  const mA_1_6 = await b(['Bat A 1er – DJAMA',            'Marcory','Appartement',null,55000,'occupe',null,null,'Bat A 1er',marcory,null]); await occ(mA_1_6);

  // Batiment B – RDC
  const mB_RDC_1 = await b(['Bat B RDC – KASSI ROSE',      'Marcory','Appartement',null,55000,'occupe',null,null,'Bat B RDC',marcory,null]); await occ(mB_RDC_1);
  const mB_RDC_2 = await b(['Bat B RDC – RAISSA',          'Marcory','Appartement',null,55000,'occupe',null,null,'Bat B RDC',marcory,null]); await occ(mB_RDC_2);
  const mB_RDC_3 = await b(['Bat B RDC – OUATTARA FALLAI', 'Marcory','Appartement',null,55000,'occupe',null,null,'Bat B RDC',marcory,null]); await occ(mB_RDC_3);

  // Batiment B – 1er Etage
  const mB_1_1 = await b(['Bat B 1er – MARIE LEA',         'Marcory','Appartement',null,55000,'occupe',null,null,'Bat B 1er',marcory,null]); await occ(mB_1_1);
  const mB_1_2 = await b(['Bat B 1er – IBO NADIA PATRICIA','Marcory','Appartement',null,55000,'occupe',null,null,'Bat B 1er',marcory,null]); await occ(mB_1_2);
  const mB_1_3 = await b(['Bat B 1er – Mme IDO',           'Marcory','Appartement',null,55000,'occupe',null,null,'Bat B 1er',marcory,null]); await occ(mB_1_3);

  // Studios & Magasins
  const mS_1 = await b(['Studio TOURE',    'Marcory','Studio',      null,60000,'occupe',null,null,'Studio extérieur',marcory,null]); await occ(mS_1);
  const mS_2 = await b(['Magasin ROSE',    'Marcory','Local commercial',null,40000,'occupe',null,null,'Magasin extérieur',marcory,null]); await occ(mS_2);
  const mS_3 = await b(['Magasin AMADOU',  'Marcory','Local commercial',null,45000,'occupe',null,null,'Magasin extérieur',marcory,null]); await occ(mS_3);

  // Locataires Marcory
  const lReine    = await l('REINE',              mA_RDC_1);
  const lNadine   = await l('NADINE',             mA_RDC_2);
  const lAdama    = await l('ADAMA',              mA_RDC_3);
  const lAmadouV  = await l('AMADOU (Vendeur Journeaux)', mA_RDC_4);
  const lRoseA    = await l('ROSE',               mA_RDC_5);
  const lFrederic = await l('KOUADIO FREDERIC',   mA_1_1);
  const lEric     = await l('ERIC',               mA_1_2);
  const lAbiba    = await l('ABIBA',              mA_1_3);
  const lChrist   = await l('ZEKRE CHRISTELLE',   mA_1_4);
  const lDesiree  = await l('DESIREE',            mA_1_5);
  const lDjama    = await l('DJAMA',              mA_1_6);
  const lKassi    = await l('KASSI ROSE',         mB_RDC_1);
  const lRaissa   = await l('RAISSA',             mB_RDC_2);
  const lFallai   = await l('OUATTARA FALLAI',    mB_RDC_3);
  const lMarie    = await l('MARIE LEA',          mB_1_1);
  const lIbo      = await l('IBO NADIA PATRICIA', mB_1_2);
  const lIdo      = await l('Mme IDO',            mB_1_3);
  const lToure    = await l('TOURE',              mS_1);
  const lRoseM    = await l('ROSE (Magasin)',      mS_2);
  const lAmadouM  = await l('AMADOU (Magasin)',    mS_3);

  // Paiements 2025 Marcory – Bat A RDC (Jan→Juil payés, Août = REINE/AMADOU impayés)
  const moisPaies = [1,2,3,4,5,6,7];
  for (const m of moisPaies) {
    const mm = String(m).padStart(2,'0');
    await pay(lReine,   mA_RDC_1, 55000, 'paye', m, 2025, `2025-${mm}-05`);
    await pay(lNadine,  mA_RDC_2, 55000, 'paye', m, 2025, `2025-${mm}-05`);
    await pay(lAdama,   mA_RDC_3, 55000, 'paye', m, 2025, `2025-${mm}-05`);
    await pay(lAmadouV, mA_RDC_4, 50000, 'paye', m, 2025, `2025-${mm}-05`);
    await pay(lRoseA,   mA_RDC_5, 60000, 'paye', m, 2025, `2025-${mm}-05`);
  }
  // Août 2025
  await pay(lReine,   mA_RDC_1, 55000, 'impaye', 8, 2025, null);
  await pay(lNadine,  mA_RDC_2, 55000, 'paye',   8, 2025, '2025-08-05');
  await pay(lAdama,   mA_RDC_3, 55000, 'paye',   8, 2025, '2025-08-05');
  await pay(lAmadouV, mA_RDC_4, 50000, 'impaye', 8, 2025, null);
  await pay(lRoseA,   mA_RDC_5, 60000, 'paye',   8, 2025, '2025-08-05');

  // ── DOKUI ─────────────────────────────────────────────────────────────────
  const dokui = await b([
    'Immeuble Dokui', 'Plateau', 'Immeuble',
    null, 0, 'occupe', 5.3002, -4.0512,
    'Appartements intérieurs et extérieurs.',
    null, 'Dokui, Abidjan',
  ]);

  // Appartements intérieur
  const dI_1 = await b(['Appt Int. – Mr KOUROUMA', 'Plateau','Appartement',null,85000,'occupe',null,null,'Intérieur',dokui,null]); await occ(dI_1);
  const dI_2 = await b(['Appt Int. – Mr KALOU',    'Plateau','Appartement',null,85000,'occupe',null,null,'Intérieur',dokui,null]); await occ(dI_2);
  const dI_3 = await b(['Appt Int. – Mr ODJE',     'Plateau','Appartement',null,85000,'occupe',null,null,'Intérieur',dokui,null]); await occ(dI_3);

  // Appartements extérieur
  const dE_1 = await b(['Appt Ext. – Mr ANICET',   'Plateau','Appartement',null,65000,'occupe',null,null,'Extérieur',dokui,null]); await occ(dE_1);
  const dE_2 = await b(['Appt Ext. – Mme KOUASSI', 'Plateau','Appartement',null,90000,'occupe',null,null,'Extérieur',dokui,null]); await occ(dE_2);
  const dE_3 = await b(['Appt Ext. – Mr MAXIM',    'Plateau','Appartement',null,90000,'occupe',null,null,'Extérieur',dokui,null]); await occ(dE_3);

  // Locataires Dokui
  const lKourouma = await l('Mr KOUROUMA', dI_1);
  const lKalou    = await l('Mr KALOU',    dI_2);
  const lOdje     = await l('Mr ODJE',     dI_3);
  const lAnicet   = await l('Mr ANICET',   dE_1);
  const lKouassi  = await l('Mme KOUASSI', dE_2);
  const lMaxim    = await l('Mr MAXIM',    dE_3);

  // Paiements Dokui – Août impayé KOUROUMA
  await pay(lKourouma, dI_1, 85000, 'impaye', 8, 2025, null);

  // ── YOPOUGON ──────────────────────────────────────────────────────────────
  const yopougon = await b([
    'Immeuble Yopougon', 'Yopougon', 'Immeuble',
    null, 0, 'occupe', 5.3618, -4.0882,
    'Bâtiments A et B + Studios Saguidiba/Kotibe.',
    null, 'Yopougon, Abidjan',
  ]);

  // Batiment A
  const yA_1 = await b(['Bat A – NIANGORAN',          'Yopougon','Appartement',null,65000,'occupe',null,null,'Bat A',yopougon,null]); await occ(yA_1);
  const yA_2 = await b(['Bat A – CISSE YNOUSSA',       'Yopougon','Appartement',null,65000,'occupe',null,null,'Bat A',yopougon,null]); await occ(yA_2);
  const yA_3 = await b(['Bat A – DOUZAN',              'Yopougon','Appartement',null,65000,'occupe',null,null,'Bat A',yopougon,null]); await occ(yA_3);
  const yA_4 = await b(['Bat A – SAMASSI TIDIANE (Magasin RDC)', 'Yopougon','Local commercial',null,90000,'occupe',null,null,'Magasin RDC',yopougon,null]); await occ(yA_4);

  // Batiment B
  const yB_1 = await b(['Bat B – DOSSO FAMOHY',        'Yopougon','Appartement',null,85000,'occupe',null,null,'Bat B',yopougon,null]); await occ(yB_1);
  const yB_2 = await b(['Bat B – DJIPRO JOEL',          'Yopougon','Appartement',null,85000,'occupe',null,null,'Bat B',yopougon,null]); await occ(yB_2);
  const yB_3 = await b(['Bat B – TRAZIE SYLVESTRE',     'Yopougon','Appartement',null,85000,'occupe',null,null,'Bat B',yopougon,null]); await occ(yB_3);
  const yB_4 = await b(['Bat B – GNIZAKO SIMEON',       'Yopougon','Appartement',null,85000,'occupe',null,null,'Bat B',yopougon,null]); await occ(yB_4);

  // Studios Saguidiba / Kotibe
  const yS_1 = await b(['Studio – BAMBA LAMINE',       'Yopougon','Studio',null,40000,'occupe',null,null,'Studios',yopougon,null]); await occ(yS_1);
  const yS_2 = await b(['Studio – COULIBALY',          'Yopougon','Studio',null,35000,'occupe',null,null,'Studios',yopougon,null]); await occ(yS_2);
  const yS_3 = await b(['Studio – NAOMIE',             'Yopougon','Studio',null,35000,'occupe',null,null,'Studios',yopougon,null]); await occ(yS_3);
  const yS_4 = await b(['Studio – VENANCE KOUAME',     'Yopougon','Studio',null,35000,'occupe',null,null,'Studios',yopougon,null]); await occ(yS_4);

  // Locataires Yopougon
  const lNiangoran = await l('NIANGORAN',         yA_1);
  const lCisse     = await l('CISSE YNOUSSA',     yA_2);
  const lDouzan    = await l('DOUZAN',            yA_3);
  const lSamassi   = await l('SAMASSI TIDIANE',   yA_4);
  const lDosso     = await l('DOSSO FAMOHY',      yB_1);
  const lDjipro    = await l('DJIPRO JOEL',       yB_2);
  const lTrazie    = await l('TRAZIE SYLVESTRE',  yB_3);
  const lGnizako   = await l('GNIZAKO SIMEON',    yB_4);
  const lBamba     = await l('BAMBA LAMINE',      yS_1);
  const lCoulibaly = await l('COULIBALY',         yS_2);
  const lNaomie    = await l('NAOMIE',            yS_3);
  const lVenance   = await l('VENANCE KOUAME',    yS_4);

  // Paiements Yopougon 2025 visibles dans le tableau
  // DJIPRO JOEL et TRAZIE SYLVESTRE : paiement Septembre 2025
  await pay(lDjipro, yB_2, 85000, 'paye', 9, 2025, '2025-09-10');
  await pay(lTrazie, yB_3, 85000, 'paye', 9, 2025, '2025-09-10');
  // NAOMIE : paiement Octobre 2025
  await pay(lNaomie, yS_3, 35000, 'paye', 10, 2025, '2025-10-08');

  console.log(`✅ Données réelles insérées :
   • Marcory  : 1 immeuble, 20 unités, 20 locataires
   • Dokui    : 1 immeuble, 6 unités,  6 locataires
   • Yopougon : 1 immeuble, 12 unités, 12 locataires
   • Total    : 39 locataires, historique 2025 partiel\n`);
}

module.exports = seedDonneesReelles;
