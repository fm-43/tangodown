/* TangoDown website: the page in six languages.

   index.html is the English page and the source of every English word: each element with
   data-i18n="key" has its English read from the page, and data-i18n-attr="aria-label:key; alt:key"
   does the same for attributes. A child marked data-slot="name" is kept as it is (its node, not a copy,
   so site.js keeps its hold on it) and a translation places it with {name}. site.js asks for its own
   words with TDi18n.t("English text", {vars}), keyed by the English as the app's string catalogs are.

   The inline script in <head> picks the language before anything shows; this file only fills it in.
   Terms follow the app's catalogs (App/Resources/Localizable.xcstrings) and l10n/<lang>/glossary.md,
   macOS's wording for Apple's terms and Microsoft's for XBOX's. Typography as docs/LOCALIZATION.md
   gives it: French « » and a narrow no-break space before : ; ? !, German „“, a half-width space
   between Latin text or digits and Japanese or Chinese. No language changes file and folder names,
   the games' names, or the Ambient Background stage's dates and labels, which stay as the app
   in English shows them. */

(() => {
  "use strict";

  const LANGUAGES = {
    en: "English",
    fr: "Français",
    de: "Deutsch",
    ja: "日本語",
    "zh-Hant": "繁體中文",
    "zh-Hans": "简体中文",
  };
  const STORE = "tangodown.lang";
  const CJK = /^(ja|zh)/;

  const STRINGS = {
    fr: {
      "meta.title": "TangoDown – Gardez chaque capture.",
      "meta.desc": "TangoDown enregistre vos captures d’écran et extraits de jeu XBOX sur votre Mac avant que le réseau XBOX ne les supprime, puis les sauvegarde sur iCloud Drive, Google Drive, Dropbox, un NAS ou un serveur WebDAV.",
      "meta.ogDesc": "Le réseau XBOX supprime vos captures au bout de 90 jours. TangoDown les rapatrie toutes sur votre Mac, puis les sauvegarde là où vous rangez déjà tout le reste.",
      "skip": "Aller au contenu",
      "nav.home": "TangoDown, retour en haut de la page",
      "nav.sections": "Sections de la page",
      "nav.menu": "Menu",
      "nav.overview": "Vue d’ensemble",
      "nav.backups": "Sauvegardes",
      "nav.library": "Bibliothèque",
      "nav.design": "Design",
      "nav.live": "Live Photo",
      "nav.details": "Détails",
      "nav.download": "Télécharger",
      "lang.label": "Langue",

      "hero.eyebrow": "TangoDown pour Mac",
      "hero.title": "Gardez chaque {target}",
      "hero.word": "capture.",
      "hero.lead": "Le réseau XBOX supprime vos captures d’écran et vos extraits de jeu 90 jours après leur envoi. <strong>TangoDown les rapatrie tous sur votre Mac, puis les sauvegarde là où vous rangez déjà tout le reste.</strong>",
      "hero.cta": "Télécharger pour Mac",
      "hero.more": "Voir comment ça marche",
      "fine": "Version {version} · macOS {macos} ou version ultérieure",
      "hero.alt": "La fenêtre principale de TangoDown : une barre latérale où chaque jeu affiche son icône sur XBOX, à côté d’une grille de captures d’écran et d’extraits.",

      "ov.line1": "Chaque {pill} capture",
      "ov.line2": "de XBOX {pill}<span class=\"ov-punct\">,</span>",
      "ov.line3": "{pill} sur votre Mac.",
      "ov.lead": "TangoDown surveille le réseau XBOX et ramène vos nouvelles captures d’écran et vos nouveaux extraits de jeu à la maison, sur votre Mac. <strong>Puis il les sauvegarde aux endroits de votre choix.</strong>",
      "ov.found": "Trouvées.",
      "ov.foundText": "Toutes les dix minutes, ou au rythme que vous avez choisi, TangoDown cherche sur le réseau XBOX les captures d’écran et les extraits qu’il n’a pas encore vus.",
      "ov.saved": "Rapatriées.",
      "ov.savedText": "Avec « Télécharger automatiquement les nouvelles captures » activé, elles arrivent directement sur votre Mac. Sans le moindre clic.",
      "ov.filed": "Rangées.",
      "ov.filedText": "Dans un dossier par jeu et par mois, sous des noms lisibles au premier coup d’œil.",
      "ov.copied": "Copiées.",
      "ov.copiedText": "Puis chaque destination que vous avez ajoutée reçoit sa propre copie, et vos souvenirs de jeu sont un peu plus à l’abri.",
      "dest.icloud": "iCloud Drive",
      "dest.gdrive": "Google Drive",

      "nt.title": "Signalées.",
      "nt.lede": "Si une capture n’est toujours pas sur votre Mac une semaine avant que XBOX ne la supprime, TangoDown vous prévient, puis à nouveau trois jours avant.",
      "nt.day1": "Jour 1",
      "nt.day90": "Jour 90",
      "nt.banner": "Notification de TangoDown",
      "close": "Fermer",
      "nt.head": "3 captures expirent bientôt",
      "nt.week": "La première atteint la limite de 90 jours de XBOX dans 7 jours.",
      "nt.last": "La première atteint la limite de 90 jours de XBOX dans 3 jours.",
      "nt.download": "Télécharger",

      "bk.eyebrow": "Sauvegardes",
      "bk.title": "Des copies partout.",
      "bk.lead": "Ajoutez iCloud Drive, Google Drive, Dropbox,{fn} un NAS ou n’importe quel serveur WebDAV, et TangoDown y copie vos captures. <strong>Ce sont des fichiers ordinaires, rangés dans les mêmes dossiers que sur votre Mac.</strong>",
      "bk.tabs": "Destinations",
      "bk.icloudH": "iCloud Drive, ou n’importe quel dossier",
      "bk.icloudP": "iCloud Drive, un disque externe, un dossier de votre Mac. Si vous pouvez le choisir dans le Finder, TangoDown peut y sauvegarder.",
      "bk.gdriveP": "Envoie vos fichiers directement sur votre Drive via l’API de Google elle-même, en se connectant avec une app de votre propre compte Google Cloud. Rien n’est partagé, aucun intermédiaire.{fn}",
      "bk.dropboxP": "Copie vos fichiers dans le dossier de l’application de votre Dropbox, en se connectant avec votre propre app Dropbox.{fn}",
      "bk.nasH": "NAS via SMB",
      "bk.nasP": "Repère le NAS sur votre réseau et y copie directement, sans rien avoir à monter. Synology, QNAP, Windows ou un autre Mac. Une copie interrompue reprend là où elle s’était arrêtée, si le serveur le permet.",
      "bk.webdavP": "Nextcloud, le service WebDAV de votre NAS ou tout serveur WebDAV auquel vous pouvez vous connecter.",
      "bk.fact1H": "À chaque destination son contenu.",
      "bk.fact1P": "Chaque destination reçoit les types, les jeux et les dates que vous choisissez, jusqu’à la taille de fichier que vous fixez.",
      "bk.fact2H": "Une sauvegarde, pas un miroir.",
      "bk.fact2P": "Retirez un téléchargement de votre Mac : ses sauvegardes restent où elles sont.",
      "bk.fact3H": "La confiance n’exclut pas le contrôle.",
      "bk.fact3P": "« Vérifier les sauvegardes » demande à chaque destination si vos fichiers s’y trouvent vraiment toujours.",
      "bk.alt": "La page d’une destination NAS dans TangoDown, où l’on choisit les types de capture, les jeux et les dates qu’elle reçoit.",

      "lib.eyebrow": "Bibliothèque",
      "lib.title": "Comme s’il avait toujours été sur votre Mac.",
      "lib.lead": "Toutes vos captures, triées par jeu, chaque jeu avec son icône sur XBOX dans la barre latérale. Cliquez, <span class=\"nowrap\">Maj-cliquez,</span> <span class=\"nowrap\">⌘-cliquez</span> ou faites glisser pour sélectionner, et faites un clic droit pour ouvrir le menu contextuel. <strong>Si vous connaissez le Finder, vous connaissez déjà TangoDown.</strong>",
      "lib.video": "Enregistrement d’écran : des captures sélectionnées dans TangoDown, ouvertes avec la barre d’espace et parcourues jusqu’à un extrait, dont on affiche les informations.",
      "lib.t1H": "Espace pour voir.",
      "lib.t1P": "Ouvrez n’importe quelle capture en grand. Si vous en sélectionnez plusieurs, ← et → ne parcourent que votre sélection.",
      "lib.t2H": "Vos jeux, dans votre ordre.",
      "lib.t2P": "Faites glisser les jeux dans la barre latérale pour les ranger à votre guise. Les nouveaux s’ajoutent à la fin.",
      "lib.t3H": "Tout retrouver, vite.",
      "lib.t3P": "Recherchez par titre de jeu, ou n’affichez que ce qui est téléchargé, ce qui ne l’est pas ou ce qui a échoué.",

      "ds.eyebrow": "Design",
      "ds.title": "Le souci du détail, à chaque image.",
      "ds.lead": "Conçu nativement en SwiftUI, avec Liquid Glass partout. <strong>Les finitions ont reçu autant de soin que les grandes fonctionnalités. <span class=\"nowrap\">Essayez-en quelques-unes.</span></strong>",
      "amb.title": "Éclairé par votre jeu.",
      "amb.text": "Chaque capture donne le ton. Ses couleurs rayonnent doucement autour de l’image et évoluent au fil d’un extrait, comme votre écran éclaire une pièce plongée dans le noir.",
      "amb.switch": "Arrière-plan d’ambiance",
      "amb.stillAlt": "Capture d’écran de Monster Hunter Stories 2: Wings of Ruin",
      "amb.picks": "Capture",
      "rf.title": "L’actualisation, redessinée.",
      "rf.text": "Cliquez pour vérifier auprès de XBOX s’il y a de nouvelles captures. Pendant la recherche, la flèche se défait en perles, qui se rassemblent ensuite pour dessiner la réponse.",
      "rf.result": "Résultat",
      "rf.success": "Réussite",
      "rf.error": "Erreur",
      "rf.actual": "Taille réelle",
      "rs.title": "Redimensionnez, tout se replace.",
      "rs.text": "Élargissez ou rétrécissez la fenêtre : chaque capture glisse jusqu’à sa nouvelle place, quel que soit le nombre de colonnes qu’elle traverse.",
      "rs.video": "Enregistrement d’écran : la bibliothèque de TangoDown se réorganise pendant que l’on redimensionne sa fenêtre.",

      "lp.eyebrow": "Live Photo",
      "lp.title": "Redonnez vie à vos plus beaux moments.",
      "lp.lead": "Choisissez jusqu’à dix secondes de n’importe quel extrait téléchargé, et l’image qui deviendra la photo. <strong>Envoyée par AirDrop sur votre iPhone, elle arrive en Live Photo, avec le son. Maintenez le doigt dessus pour revivre l’instant, ou <span class=\"nowrap\">partagez-la</span> sur toute app sociale compatible avec les Live Photos.</strong>{fn}",
      "lp.phone": "Maintenez pour lire la Live Photo",
      "lp.badge": "LIVE",
      "lp.editor": "Éditeur de Live Photo",
      "lp.start": "Début",
      "lp.end": "Fin",
      "lp.photo": "Photo clé",
      "lp.hint": "Faites glisser les poignées jaunes pour choisir le moment, et le cadre blanc pour choisir la photo. Puis appuyez longuement sur l’image.",

      "dt.title": "Et mille petites attentions.",
      "mb.title": "Toujours dans la barre des menus.",
      "mb.text": "Vérifiez maintenant, mettez les transferts en pause, voyez ce qui expire bientôt. Activez « Ouvrir avec la session » : TangoDown est toujours là, sans jamais gêner.",
      "mb.time": "ven. 3 avr.  07:55",
      "sc.unit": "min",
      "sc.title": "Au rythme que vous choisissez.",
      "sc.text": "TangoDown vérifie XBOX toutes les dix minutes. Ou jusqu’à toutes les cinq minutes, ou seulement toutes les six heures.",
      "cl.name": "Cloud XBOX",
      "cl.free": "6,85 GB libres",
      "cl.title": "Gardez un œil sur le cloud.",
      "cl.text": "L’espace encore libre dans votre stockage cloud XBOX,{fn} tout en bas de la barre latérale.",
      "ac.title": "Tous les transferts, au même endroit.",
      "ac.text": "Téléchargements et copies, avec leur vitesse et leur progression. Mettez en pause, reprenez ou réessayez un transfert, ou tous à la fois.",
      "ac.alt": "Le tableau Activité de TangoDown : téléchargements et copies, avec leur progression et leur destination.",
      "sp.title": "De l’air pour votre Mac.",
      "sp.text": "« Retirer les téléchargements sauvegardés » libère votre Mac de ce que vos destinations conservent déjà. Lancez d’abord « Vérifier les sauvegardes » si vous voulez en avoir le cœur net.",
      "pv.title": "Aucun intermédiaire.",
      "pv.text": "Pas de compte TangoDown, pas de serveurs TangoDown. Vos captures vont de XBOX à votre Mac, puis à vos destinations, et chaque connexion est scellée par la Secure Enclave de votre Mac.",
      "lg.list": "Langues",
      "lg.title": "Parle votre langue.",
      "lg.text": "TangoDown suit la langue de votre Mac, ou celle de votre choix. Les noms de dossiers et de fichiers restent identiques dans toutes les langues.",
      "ax.title": "Pensé pour tous.",
      "ax.text": "VoiceOver lit le jeu, le type, la durée et la date de chaque capture. Contrôle complet au clavier, et respect des réglages Réduire la transparence, Réduire les animations et Augmenter le contraste.",

      "dl.alt": "Icône de l’app TangoDown",
      "dl.title": "Réglez-le une fois pour toutes.",
      "dl.lead": "Connectez-vous à XBOX, et TangoDown s’occupe du reste.",
      "dl.cta": "Télécharger TangoDown",
      "fo.summary": "Ouvrir TangoDown pour la première fois",
      "fo.p1": "TangoDown n’est pas notarisé par Apple, macOS vous demande donc de confirmer son ouverture une fois.",
      "fo.s1": "Placez TangoDown dans votre dossier Applications, puis double-cliquez dessus. Quand macOS indique qu’il n’a pas pu vérifier TangoDown, cliquez sur Terminé.",
      "fo.s2": "Ouvrez Réglages Système › Confidentialité et sécurité. Sous Sécurité, à côté du message concernant TangoDown, cliquez sur Ouvrir quand même, puis confirmez.",
      "fo.p2": "Ensuite, TangoDown s’ouvre comme n’importe quelle autre app. Refaites la même chose après avoir installé une nouvelle version.",

      "fn.1": "Google Drive et Dropbox se connectent avec une app que vous créez dans votre propre compte Google Cloud ou Dropbox : rien n’est partagé avec qui que ce soit, ni app, ni quota, ni connexion. Les guides pas à pas prennent une dizaine de minutes et se trouvent dans le menu Aide de TangoDown. {back}",
      "fn.2": "Une Live Photo créée à partir d’un extrait se lit dans Photos sur iPhone et sur Mac. iOS réserve les fonds d’écran animés de l’écran verrouillé aux Live Photos prises avec son propre appareil photo. {back}",
      "fn.3": "Le réseau XBOX conserve jusqu’à 10 GB de captures envoyées. Comme il n’indique pas cette limite, TangoDown se base sur le chiffre donné par le Support XBOX. {back}",
      "fn.back": "Retour au texte",
      "fn.ref1": "Note 1",
      "fn.ref2": "Note 2",
      "fn.ref3": "Note 3",
      "ft.legal": "TangoDown n’est affilié ni à Microsoft ni à XBOX. XBOX est une marque commerciale du groupe de sociétés Microsoft.",

      "3 captures downloaded.": "3 captures téléchargées.",
      "Copy to {name}": "Sauvegarder vers {name}",
      "Play": "Lire",
      "Replay": "Revoir",
      "Check with XBOX Now": "Vérifier auprès de XBOX",
      "Checking with XBOX": "Vérification auprès de XBOX en cours",
      "Up to Date": "À jour",
      "Couldn’t Reach XBOX": "Impossible de joindre XBOX",
      "{game} screenshot": "Capture d’écran de {game}",
      "{n} s": "{n} s",
      "photo at {t}": "photo clé à {t}",
      "{n} seconds": "{n} secondes",
    },

    de: {
      "meta.title": "TangoDown – Kein Moment geht verloren.",
      "meta.desc": "TangoDown lädt deine XBOX-Screenshots und -Spielclips auf deinen Mac, bevor das XBOX-Netzwerk sie löscht, und sichert sie dann in iCloud Drive, Google Drive, Dropbox, auf einem NAS oder per WebDAV.",
      "meta.ogDesc": "Das XBOX-Netzwerk löscht deine Aufzeichnungen nach 90 Tagen. TangoDown holt sie alle auf deinen Mac und sichert sie dort, wo du deine Daten ohnehin aufbewahrst.",
      "skip": "Zum Inhalt springen",
      "nav.home": "TangoDown, zurück nach oben",
      "nav.sections": "Seitenbereiche",
      "nav.menu": "Menü",
      "nav.overview": "Überblick",
      "nav.backups": "Backups",
      "nav.library": "Mediathek",
      "nav.design": "Design",
      "nav.live": "Live Photo",
      "nav.details": "Details",
      "nav.download": "Download",
      "lang.label": "Sprache",

      "hero.eyebrow": "TangoDown für Mac",
      "hero.title": "Kein {target} geht verloren.",
      "hero.word": "Moment",
      "hero.lead": "Das XBOX-Netzwerk löscht deine Screenshots und Spielclips 90 Tage nach dem Hochladen. <strong>TangoDown holt sie alle auf deinen Mac und sichert sie dann dort, wo du deine Daten ohnehin aufbewahrst.</strong>",
      "hero.cta": "Download für Mac",
      "hero.more": "So funktioniert’s",
      "fine": "Version {version} · macOS {macos} oder neuer",
      "hero.alt": "Das Hauptfenster von TangoDown: eine Seitenleiste mit Spielen und ihren Symbolen von XBOX neben einem Raster aus Screenshots und Clips.",

      "ov.line1": "Jede {pill} Aufzeichnung",
      "ov.line2": "von XBOX {pill}<span class=\"ov-punct\">,</span>",
      "ov.line3": "{pill} auf deinem Mac.",
      "ov.lead": "TangoDown sieht im XBOX-Netzwerk nach neuen Screenshots und Spielclips und holt sie nach Hause auf deinen Mac. <strong>Danach sichert TangoDown sie an den Orten deiner Wahl.</strong>",
      "ov.found": "Gefunden.",
      "ov.foundText": "Alle zehn Minuten – oder in dem Rhythmus, den du festlegst – sucht TangoDown im XBOX-Netzwerk nach Screenshots und Clips, die neu dazugekommen sind.",
      "ov.saved": "Geladen.",
      "ov.savedText": "Ist „Neue Aufzeichnungen automatisch laden“ aktiv, landen sie direkt auf deinem Mac. Ohne einen einzigen Klick.",
      "ov.filed": "Abgelegt.",
      "ov.filedText": "In einem Ordner pro Spiel und Monat, mit Namen, die sich auf einen Blick lesen lassen.",
      "ov.copied": "Kopiert.",
      "ov.copiedText": "Dann bekommt jedes Ziel, das du hinzugefügt hast, eine eigene Kopie – und deine Spielerinnerungen sind ein Stück besser aufgehoben.",
      "dest.icloud": "iCloud Drive",
      "dest.gdrive": "Google Drive",

      "nt.title": "Bemerkt.",
      "nt.lede": "Ist eine Aufzeichnung eine Woche, bevor XBOX sie löscht, noch nicht auf deinem Mac, sagt TangoDown dir Bescheid – und drei Tage vorher noch einmal.",
      "nt.day1": "Tag 1",
      "nt.day90": "Tag 90",
      "nt.banner": "Mitteilung von TangoDown",
      "close": "Schließen",
      "nt.head": "3 Aufzeichnungen laufen bald ab",
      "nt.week": "Die erste erreicht in 7 Tagen das 90-Tage-Limit von XBOX.",
      "nt.last": "Die erste erreicht in 3 Tagen das 90-Tage-Limit von XBOX.",
      "nt.download": "Laden",

      "bk.eyebrow": "Backups",
      "bk.title": "Überall eine Kopie.",
      "bk.lead": "Füge iCloud Drive, Google Drive, Dropbox,{fn} ein NAS oder einen beliebigen WebDAV-Server hinzu, und TangoDown kopiert deine Aufzeichnungen an jedes einzelne Ziel. <strong>Es sind ganz normale Dateien, in denselben Ordnern wie auf deinem Mac.</strong>",
      "bk.tabs": "Ziele",
      "bk.icloudH": "iCloud Drive oder ein beliebiger Ordner",
      "bk.icloudP": "iCloud Drive, ein externes Laufwerk, ein Ordner auf deinem Mac. Alles, was du im Finder auswählen kannst, eignet sich auch als Ziel für TangoDown.",
      "bk.gdriveP": "Lädt über Googles eigene API direkt in dein Google Drive hoch, angemeldet mit einer App in deinem eigenen Google-Cloud-Konto. Nichts wird geteilt, niemand sitzt dazwischen.{fn}",
      "bk.dropboxP": "Kopiert in einen App-Ordner in deiner Dropbox, angemeldet mit deiner eigenen Dropbox-App.{fn}",
      "bk.nasH": "NAS über SMB",
      "bk.nasP": "Findet das NAS in deinem Netzwerk und kopiert direkt darauf, ganz ohne Freigaben verbinden zu müssen. Synology, QNAP, Windows oder ein anderer Mac. Eine unterbrochene Kopie macht dort weiter, wo sie aufgehört hat – sofern der Server das zulässt.",
      "bk.webdavP": "Nextcloud, der WebDAV-Dienst deines NAS oder jeder andere WebDAV-Server, bei dem du dich anmelden kannst.",
      "bk.fact1H": "Du entscheidest, was wohin geht.",
      "bk.fact1P": "Jedes Ziel bekommt die Typen, Spiele und Zeiträume, die du auswählst – bis zu der Dateigröße, die du festlegst.",
      "bk.fact2H": "Ein Backup, kein Spiegel.",
      "bk.fact2P": "Entfernst du einen Download von deinem Mac, bleiben seine Backups, wo sie sind.",
      "bk.fact3H": "Vertrauen ist gut, Kontrolle ist besser.",
      "bk.fact3P": "„Backups prüfen“ fragt bei jedem Ziel nach, ob deine Dateien wirklich noch da sind.",
      "bk.alt": "Die Seite eines NAS-Ziels in TangoDown: Hier legst du fest, welche Aufzeichnungstypen, Spiele und Zeiträume es erhält.",

      "lib.eyebrow": "Mediathek",
      "lib.title": "Wie ab Werk auf deinem Mac.",
      "lib.lead": "Jede Aufzeichnung, nach Spiel sortiert, jedes Spiel mit seinem Symbol von XBOX in der Seitenleiste. Klicken, <span class=\"nowrap\">Umschalt-Klicken,</span> <span class=\"nowrap\">⌘-Klicken</span> oder Ziehen zum Auswählen – und ein Rechtsklick öffnet das Kontextmenü. <strong>Wenn du den Finder kennst, kennst du TangoDown schon.</strong>",
      "lib.video": "Bildschirmaufnahme: Aufzeichnungen in TangoDown auswählen, mit der Leertaste öffnen, bis zu einem Clip blättern und seine Informationen einblenden.",
      "lib.t1H": "Leertaste zum Ansehen.",
      "lib.t1P": "Öffne jede Aufzeichnung in voller Größe. Sind mehrere ausgewählt, blätterst du mit ← und → nur durch deine Auswahl.",
      "lib.t2H": "Deine Spiele, deine Reihenfolge.",
      "lib.t2P": "Zieh die Spiele in der Seitenleiste in die Reihenfolge, die dir gefällt. Neue kommen ans Ende.",
      "lib.t3H": "Schnell gefunden.",
      "lib.t3P": "Suche nach dem Spieltitel – oder zeig nur an, was geladen ist, was nicht oder was fehlgeschlagen ist.",

      "ds.eyebrow": "Design",
      "ds.title": "Liebe zum Detail, bis ins letzte Pixel.",
      "ds.lead": "Nativ in SwiftUI entwickelt, durchgehend mit Liquid Glass. <strong>Der Feinschliff bekam genauso viel Aufmerksamkeit wie die großen Funktionen. Probier ein paar davon aus.</strong>",
      "amb.title": "Im Licht deines Spiels.",
      "amb.text": "Jede Aufzeichnung gibt die Stimmung vor. Ihre Farben leuchten sanft rund um das Bild und wandeln sich mit einem laufenden Clip – so wie dein Bildschirm einen dunklen Raum erhellt.",
      "amb.switch": "Ambiente-Hintergrund",
      "amb.stillAlt": "Screenshot aus Monster Hunter Stories 2: Wings of Ruin",
      "amb.picks": "Aufzeichnung",
      "rf.title": "Aktualisieren, neu gedacht.",
      "rf.text": "Klick, um bei XBOX auf neue Aufzeichnungen zu prüfen. Während der Suche zerfällt der Pfeil in Perlen, die sich dann zur Antwort zusammenfügen.",
      "rf.result": "Ergebnis",
      "rf.success": "Erfolg",
      "rf.error": "Fehler",
      "rf.actual": "Originalgröße",
      "rs.title": "Neue Größe, neue Ordnung.",
      "rs.text": "Zieh das Fenster breiter oder schmaler, und jede Aufzeichnung gleitet an ihren neuen Platz – egal, wie viele Spalten sie dabei überquert.",
      "rs.video": "Bildschirmaufnahme: Die Mediathek von TangoDown ordnet sich neu, während sich die Fenstergröße ändert.",

      "lp.eyebrow": "Live Photo",
      "lp.title": "Erwecke deine besten Momente wieder zum Leben.",
      "lp.lead": "Wähle bis zu zehn Sekunden aus einem geladenen Clip und das Bild, das zum Foto wird. <strong>Schick es per AirDrop auf dein iPhone, und es kommt als Live Photo an – samt Ton. Halte es gedrückt, um den Moment noch einmal zu erleben, oder teile es in jeder sozialen App, die Live Photos unterstützt.</strong>{fn}",
      "lp.phone": "Gedrückt halten, um das Live Photo abzuspielen",
      "lp.badge": "LIVE",
      "lp.editor": "Live-Photo-Editor",
      "lp.start": "Anfang",
      "lp.end": "Ende",
      "lp.photo": "Schlüsselfoto",
      "lp.hint": "Zieh die gelben Griffe, um den Moment zu wählen, und den weißen Rahmen, um das Foto festzulegen. Halte dann das Bild gedrückt.",

      "dt.title": "Und all die kleinen Dinge.",
      "mb.title": "Zu Hause in deiner Menüleiste.",
      "mb.text": "Jetzt prüfen, Übertragungen anhalten, sehen, was bald abläuft. Schalte „Bei Anmeldung öffnen“ ein, und TangoDown ist immer da, ohne je im Weg zu sein.",
      "mb.time": "Fr. 3. Apr.  07:55",
      "sc.unit": "Min.",
      "sc.title": "In deinem Rhythmus.",
      "sc.text": "TangoDown prüft alle zehn Minuten bei XBOX. Oder so oft wie alle fünf Minuten – oder nur alle sechs Stunden.",
      "cl.name": "XBOX-Cloud",
      "cl.free": "6,85 GB frei",
      "cl.title": "Immer im Blick, wie voll die Cloud ist.",
      "cl.text": "Wie viel von deinem XBOX-Cloud-Speicher noch frei ist,{fn} direkt unten in der Seitenleiste.",
      "ac.title": "Alle Übertragungen an einem Ort.",
      "ac.text": "Downloads und Kopien, mit Geschwindigkeit und Fortschritt. Halte einzelne an, setze sie fort oder versuch es erneut – oder alle auf einmal.",
      "ac.alt": "Die Aktivitätstabelle von TangoDown: Downloads und Kopien mit Fortschritt und Ziel.",
      "sp.title": "Luft zum Atmen.",
      "sp.text": "„Gesicherte Downloads entfernen“ räumt von deinem Mac, was deine Ziele bereits haben. Wenn du sichergehen willst, führe vorher „Backups prüfen“ aus.",
      "pv.title": "Niemand dazwischen.",
      "pv.text": "Kein TangoDown-Konto, keine TangoDown-Server. Deine Aufzeichnungen gehen von XBOX auf deinen Mac und von dort an deine Ziele, und jede Anmeldung wird von der Secure Enclave deines Mac versiegelt.",
      "lg.list": "Sprachen",
      "lg.title": "Spricht deine Sprache.",
      "lg.text": "TangoDown folgt der Sprache deines Mac – oder der, die du auswählst. Ordner- und Dateinamen bleiben in jeder Sprache gleich.",
      "ax.title": "Für alle gemacht.",
      "ax.text": "VoiceOver liest Spiel, Art, Länge und Datum jeder Aufzeichnung vor. Volle Tastatursteuerung, und auch „Transparenz reduzieren“, „Bewegung reduzieren“ und „Kontrast erhöhen“ werden berücksichtigt.",

      "dl.alt": "App-Symbol von TangoDown",
      "dl.title": "Einmal einrichten, fertig.",
      "dl.lead": "Melde dich bei XBOX an, und <span class=\"nowrap\">TangoDown</span> kümmert sich um den Rest.",
      "dl.cta": "TangoDown laden",
      "fo.summary": "TangoDown zum ersten Mal öffnen",
      "fo.p1": "TangoDown ist nicht von Apple notarisiert, deshalb bittet macOS dich einmal um Bestätigung.",
      "fo.s1": "Bewege TangoDown in deinen Programme-Ordner und doppelklicke darauf. Wenn macOS meldet, dass TangoDown nicht überprüft werden konnte, klicke auf „Fertig“.",
      "fo.s2": "Öffne „Systemeinstellungen“ › „Datenschutz & Sicherheit“. Klicke unter „Sicherheit“ neben der Meldung zu TangoDown auf „Dennoch öffnen“ und bestätige dann.",
      "fo.p2": "Danach öffnet sich TangoDown wie jede andere App. Wiederhole das nach der Installation einer neuen Version.",

      "fn.1": "Google Drive und Dropbox melden sich mit einer App an, die du in deinem eigenen Google-Cloud- oder Dropbox-Konto erstellst. So teilst du weder App noch Kontingent noch Anmeldung mit anderen. Die Schritt-für-Schritt-Anleitungen dauern etwa zehn Minuten und stehen in TangoDown im Menü „Hilfe“. {back}",
      "fn.2": "Ein aus einem Clip erstelltes Live Photo lässt sich in „Fotos“ auf iPhone und Mac abspielen. Animierte Hintergrundbilder für den Sperrbildschirm behält iOS Live Photos vor, die mit der eigenen Kamera aufgenommen wurden. {back}",
      "fn.3": "Das XBOX-Netzwerk speichert bis zu 10 GB hochgeladene Aufzeichnungen. Da es das Limit nicht meldet, rechnet TangoDown mit dem Wert, den der XBOX-Support angibt. {back}",
      "fn.back": "Zurück zum Text",
      "fn.ref1": "Fußnote 1",
      "fn.ref2": "Fußnote 2",
      "fn.ref3": "Fußnote 3",
      "ft.legal": "TangoDown steht in keiner Verbindung zu Microsoft oder XBOX. XBOX ist eine Marke der Microsoft-Unternehmensgruppe.",

      "3 captures downloaded.": "3 Aufzeichnungen geladen.",
      "Copy to {name}": "Auf {name} sichern",
      "Play": "Abspielen",
      "Replay": "Erneut abspielen",
      "Check with XBOX Now": "Jetzt bei XBOX prüfen",
      "Checking with XBOX": "Wird bei XBOX geprüft",
      "Up to Date": "Aktuell",
      "Couldn’t Reach XBOX": "XBOX war nicht erreichbar",
      "{game} screenshot": "Screenshot aus {game}",
      "{n} s": "{n} s",
      "photo at {t}": "Schlüsselfoto bei {t}",
      "{n} seconds": "{n} Sekunden",
    },

    ja: {
      "meta.title": "TangoDown – すべてのショットを、手元に",
      "meta.desc": "TangoDown は、XBOX のスクリーンショットとゲーム クリップを XBOX ネットワークから削除される前に Mac に保存し、iCloud Drive、Google ドライブ、Dropbox、NAS、WebDAV にバックアップします。",
      "meta.ogDesc": "XBOX ネットワークのキャプチャは 90 日で削除されます。TangoDown が、ひとつ残らず Mac に保存し、お好みの場所へバックアップします。",
      "skip": "本文へスキップ",
      "nav.home": "TangoDown、ページの先頭へ",
      "nav.sections": "ページ内のセクション",
      "nav.menu": "メニュー",
      "nav.overview": "概要",
      "nav.backups": "バックアップ",
      "nav.library": "ライブラリ",
      "nav.design": "デザイン",
      "nav.live": "Live Photos",
      "nav.details": "詳細",
      "nav.download": "ダウンロード",
      "lang.label": "言語",

      "hero.eyebrow": "Mac 用 TangoDown",
      "hero.title": "すべての<span class=\"nowrap\">{target}を、</span><wbr>手元に",
      "hero.word": "ショット",
      "hero.lead": "XBOX ネットワークでは、スクリーンショットと<wbr>ゲーム クリップが<wbr>アップロードから 90 日で<wbr>削除されます。<strong>TangoDown が、ひとつ残らず Mac に<wbr>保存し、お好みの<wbr>場所へ<wbr>バックアップします。</strong>",
      "hero.cta": "Mac 版をダウンロード",
      "hero.more": "しくみを見る",
      "fine": "バージョン {version} · macOS {macos} 以降",
      "hero.alt": "TangoDown のメインウインドウ。XBOX 上のアイコンが付いたゲームが並ぶサイドバーと、スクリーンショットやクリップのグリッド。",

      "ov.line1": "すべての{pill}キャプチャを",
      "ov.line2": "XBOX から{pill}<span class=\"ov-punct\">、</span>",
      "ov.line3": "{pill}手元の Mac へ。",
      "ov.lead": "TangoDown は XBOX ネットワークで<wbr>新しい<wbr>スクリーンショットや<wbr>ゲーム クリップを<wbr>見つけて、Mac に<wbr>取り込みます。<strong>さらに、選んだ<wbr>場所へ<wbr>バックアップします。</strong>",
      "ov.found": "発見。",
      "ov.foundText": "TangoDown は 10 分ごと、または設定したスケジュールで XBOX ネットワークを確認し、まだライブラリにないスクリーンショットやクリップを探します。",
      "ov.saved": "保存。",
      "ov.savedText": "“新しいキャプチャを自動で<span class=\"nowrap\">ダウンロード”を</span><span class=\"nowrap\">オンにしておけば、</span>そのまま Mac に<span class=\"nowrap\">保存されます。</span><span class=\"nowrap\">クリック操作は</span>一切不要です。",
      "ov.filed": "整理。",
      "ov.filedText": "ゲームごと、月ごとのフォルダに、ひと目でわかる名前で整理されます。",
      "ov.copied": "複製。",
      "ov.copiedText": "続いて、追加したバックアップ先ごとにコピーが作られます。ゲームの思い出が、より確かなものになります。",
      "dest.icloud": "iCloud Drive",
      "dest.gdrive": "Google ドライブ",

      "nt.title": "通知。",
      "nt.lede": "XBOX から<span class=\"nowrap\">削除される</span> <span class=\"nowrap\">1 週間前に</span><span class=\"nowrap\">なっても</span><span class=\"nowrap\">キャプチャが</span> <span class=\"nowrap\">Mac にない</span><span class=\"nowrap\">場合は、</span><span class=\"nowrap\">TangoDown が</span><span class=\"nowrap\">お知らせします。</span><span class=\"nowrap\">3 日前にも、</span><span class=\"nowrap\">もう一度。</span>",
      "nt.day1": "1 日目",
      "nt.day90": "90 日目",
      "nt.banner": "TangoDown からの通知",
      "close": "閉じる",
      "nt.head": "3 件の<wbr>キャプチャが<wbr>まもなく<wbr>期限切れ",
      "nt.week": "最初のキャプチャが 7 日後に XBOX の 90 日間の保存期限に達します。",
      "nt.last": "最初のキャプチャが 3 日後に XBOX の 90 日間の保存期限に達します。",
      "nt.download": "ダウンロード",

      "bk.eyebrow": "バックアップ",
      "bk.title": "どこにでも、<wbr>コピーを",
      "bk.lead": "iCloud Drive、Google ドライブ、Dropbox{fn}、NAS、WebDAV サーバを<wbr>追加すれば、TangoDown が<wbr>それぞれに<wbr>キャプチャを<wbr>コピーします。<strong>普通の<wbr>ファイルとして、Mac と<wbr>同じ<wbr>フォルダ構成で<wbr>保存されます。</strong>",
      "bk.tabs": "バックアップ先",
      "bk.icloudH": "iCloud Drive または<wbr>任意の<wbr>フォルダ",
      "bk.icloudP": "iCloud Drive、外付けドライブ、Mac 内のフォルダ。Finder で選べる場所なら、どこにでもバックアップできます。",
      "bk.gdriveP": "Google の公式 API を通じて、Google ドライブへ直接アップロードします。サインインには、ご自身の Google Cloud アカウントで作成したアプリを使います。何も共有せず、仲介も一切ありません。{fn}",
      "bk.dropboxP": "Dropbox 内のアプリフォルダにコピーします。サインインには、ご自身の Dropbox アプリを使います。{fn}",
      "bk.nasH": "NAS<wbr>（SMB 経由）",
      "bk.nasP": "ネットワーク上の NAS を見つけて、マウントせずに直接コピーします。Synology、QNAP、Windows、別の Mac にも対応。コピーが途中で止まっても、サーバがサポートしていれば続きから再開します。",
      "bk.webdavP": "Nextcloud、NAS の WebDAV サービスなど、サインインできる WebDAV サーバならどれでも使えます。",
      "bk.fact1H": "何を<wbr>どこへ、自由に",
      "bk.fact1P": "バックアップ先ごとに、受け取る種類、ゲーム、日付を選べます。ファイルサイズの上限も設定できます。",
      "bk.fact2H": "ミラーではなく、バックアップ",
      "bk.fact2P": "Mac からダウンロードを削除しても、バックアップはそのまま残ります。",
      "bk.fact3H": "念には<wbr>念を",
      "bk.fact3P": "“バックアップを確認”を使えば、ファイルが本当に残っているかを各バックアップ先に問い合わせます。",
      "bk.alt": "TangoDown の NAS バックアップ先のページ。受け取るキャプチャの種類、ゲーム、日付を選んでいるところ。",

      "lib.eyebrow": "ライブラリ",
      "lib.title": "Mac に<wbr>最初から<wbr>入っていたような、<wbr>使い心地",
      "lib.lead": "すべての<wbr>キャプチャは<wbr>ゲームごとに<wbr>整理され、サイドバーには<wbr>各ゲームの XBOX 上の<wbr>アイコンが<wbr>並びます。クリック、Shift + クリック、⌘ + クリック、ドラッグで<wbr>選択でき、右クリックで<wbr>メニューが<wbr>開きます。<strong>Finder が<wbr>使えれば、TangoDown も<wbr>そのまま<wbr>使えます。</strong>",
      "lib.video": "画面収録：TangoDown でキャプチャを選択し、スペースバーで開いて、クリップまで送り、その情報を表示している様子。",
      "lib.t1H": "スペースバーで、すぐ<wbr>見る",
      "lib.t1P": "どのキャプチャもフルサイズで開けます。複数選択しているときは、← と → で選択した項目だけを順に切り替えられます。",
      "lib.t2H": "ゲームは、好きな<wbr>順に",
      "lib.t2P": "サイドバーのゲームは、ドラッグで好きな順に並べ替えられます。新しいゲームは末尾に追加されます。",
      "lib.t3H": "すばやく<wbr>見つかる",
      "lib.t3P": "ゲームタイトルで検索することも、ダウンロード済み、未ダウンロード、失敗したものだけを表示することもできます。",

      "ds.eyebrow": "デザイン",
      "ds.title": "どのフレームも、<wbr>磨き抜いて",
      "ds.lead": "SwiftUI で<wbr>ネイティブに<wbr>開発し、全体に Liquid Glass を<wbr>採用。<strong>細かな<wbr>仕上げにも、大きな<wbr>機能と<wbr>同じだけの<wbr>力を<wbr>注ぎました。いくつか<wbr>試して<wbr>みてください。</strong>",
      "amb.title": "ゲームが、照らす",
      "amb.text": "キャプチャごとに、雰囲気が変わります。その色がフレームのまわりをやわらかく彩り、クリップの再生に合わせて移ろいます。暗い部屋をスクリーンが照らすように。",
      "amb.switch": "アンビエント背景",
      "amb.stillAlt": "Monster Hunter Stories 2: Wings of Ruin のスクリーンショット",
      "amb.picks": "キャプチャ",
      "rf.title": "更新ボタンを、一新",
      "rf.text": "クリックすると、XBOX に新しいキャプチャがないか確認します。確認中は矢印がビーズにほどけ、やがて集まって結果を描き出します。",
      "rf.result": "結果",
      "rf.success": "成功",
      "rf.error": "エラー",
      "rf.actual": "実際のサイズ",
      "rs.title": "リサイズも、なめらかに",
      "rs.text": "ウインドウの幅を広げても狭めても、すべてのキャプチャが新しい位置へすっと移動します。何列またいでも。",
      "rs.video": "画面収録：ウインドウのサイズ変更に合わせて、TangoDown のライブラリが再配置される様子。",

      "lp.eyebrow": "Live Photos",
      "lp.title": "最高の<wbr>瞬間が、<wbr>もう一度<wbr>動き出す",
      "lp.lead": "ダウンロード済みの<wbr>クリップから<wbr>最大 10 秒と、写真にする<wbr>フレームを<wbr>選びます。<strong>AirDrop で iPhone に<wbr>送れば、サウンド付きの Live Photos として<wbr>届きます。長押しで<wbr>その<wbr>瞬間を<wbr>もう一度。Live Photos に<wbr>対応した SNS アプリで<wbr>共有する<wbr>ことも<wbr>できます。</strong>{fn}",
      "lp.phone": "長押しで Live Photos を再生",
      "lp.badge": "LIVE",
      "lp.editor": "Live Photos エディタ",
      "lp.start": "開始",
      "lp.end": "終了",
      "lp.photo": "キー写真",
      "lp.hint": "黄色いハンドルをドラッグして区間を、白い枠をドラッグして写真を選びます。そのあと、画像を長押ししてください。",

      "dt.title": "そして、<wbr>細やかな<wbr>ところまで",
      "mb.title": "メニューバーに、いつも",
      "mb.text": "今すぐ確認、転送の一時停止、まもなく期限切れになるキャプチャのチェックも。“ログイン時に開く”をオンにすれば、TangoDown はいつでもそこにあって、作業の邪魔をしません。",
      "mb.time": "4月3日(金)  7:55",
      "sc.unit": "分",
      "sc.title": "確認の<wbr>間隔は、お好みで",
      "sc.text": "TangoDown は 10 分ごとに XBOX を確認します。5 分ごとまで短くすることも、6 時間ごとまで長くすることもできます。",
      "cl.name": "XBOX クラウド",
      "cl.free": "6.85 GB 空き",
      "cl.title": "クラウドの<wbr>空き容量も、ひと目で",
      "cl.text": "XBOX の<span class=\"nowrap\">クラウド</span> <span class=\"nowrap\">ストレージの</span><span class=\"nowrap\">空き容量{fn}を、</span><span class=\"nowrap\">サイドバーの</span><span class=\"nowrap\">いちばん下に</span><span class=\"nowrap\">表示します。</span>",
      "ac.title": "すべての<wbr>転送を、ひとつの<wbr>場所で",
      "ac.text": "ダウンロードとコピーを、速度と進行状況とともに表示。ひとつずつでも、まとめてでも、一時停止、再開、再試行ができます。",
      "ac.alt": "TangoDown のアクティビティの表。ダウンロードとコピーの進行状況とバックアップ先。",
      "sp.title": "Mac に、ゆとりを",
      "sp.text": "“バックアップ済みのダウンロードを削除”で、バックアップ先にすでにあるものを Mac から片付けられます。念のため確かめたいときは、先に“バックアップを確認”を実行してください。",
      "pv.title": "間に、誰も介さない",
      "pv.text": "TangoDown のアカウントも、TangoDown のサーバもありません。キャプチャは XBOX から Mac へ、そしてバックアップ先へと届き、すべてのサインイン情報は Mac の Secure Enclave で保護されます。",
      "lg.list": "言語",
      "lg.title": "あなたの<wbr>言葉で",
      "lg.text": "TangoDown は Mac の言語に合わせて表示され、好きな言語を選ぶこともできます。フォルダ名とファイル名は、どの言語でも変わりません。",
      "ax.title": "すべての<wbr>人のために",
      "ax.text": "VoiceOver が、各キャプチャのゲーム、種類、長さ、日付を読み上げます。キーボードだけで操作でき、“透明度を下げる”、“視差効果を減らす”、“コントラストを上げる”にもすべて対応しています。",

      "dl.alt": "TangoDown のアプリアイコン",
      "dl.title": "設定は、一度だけ",
      "dl.lead": "XBOX に<wbr>サインインすれば、あとは TangoDown に<wbr>おまかせ。",
      "dl.cta": "TangoDown をダウンロード",
      "fo.summary": "TangoDown をはじめて開くとき",
      "fo.p1": "TangoDown は Apple の公証を受けていないため、最初の 1 回だけ macOS で確認が必要です。",
      "fo.s1": "TangoDown を“アプリケーション”フォルダに移動して、ダブルクリックします。TangoDown を検証できなかったと macOS に表示されたら、“完了”をクリックします。",
      "fo.s2": "“システム設定” › “プライバシーとセキュリティ”を開きます。“セキュリティ”セクションで、TangoDown に関するメッセージの横にある“このまま開く”をクリックし、確認します。",
      "fo.p2": "以降は、ほかのアプリと同じように開けます。新しいバージョンをインストールしたときも、同じ手順を行ってください。",

      "fn.1": "Google ドライブと Dropbox には、ご自身の Google Cloud アカウントまたは Dropbox アカウントで作成したアプリでサインインします。そのため、アプリ、利用枠、サインイン情報を誰かと共有することはありません。手順ガイドは TangoDown の“ヘルプ”メニューにあり、10 分ほどで設定できます。 {back}",
      "fn.2": "クリップから作成した Live Photos は、iPhone と Mac の“写真”で再生できます。iOS のロック画面の動く壁紙は、iPhone のカメラで撮影した Live Photos でのみ使えます。 {back}",
      "fn.3": "XBOX ネットワークには、アップロードしたキャプチャを最大 10 GB まで保存できます。XBOX ネットワークはこの上限値を返さないため、TangoDown は XBOX サポートが案内している値をもとに計算しています。 {back}",
      "fn.back": "本文に戻る",
      "fn.ref1": "注 1",
      "fn.ref2": "注 2",
      "fn.ref3": "注 3",
      "ft.legal": "TangoDown は Microsoft および XBOX とは提携していません。XBOX は Microsoft グループ企業の商標です。",

      "3 captures downloaded.": "3 件のキャプチャをダウンロードしました。",
      "Copy to {name}": "{name}にバックアップ",
      "Play": "再生",
      "Replay": "もう一度再生",
      "Check with XBOX Now": "今すぐ XBOX を確認",
      "Checking with XBOX": "XBOX を確認中",
      "Up to Date": "最新の状態",
      "Couldn’t Reach XBOX": "XBOX に接続できません",
      "{game} screenshot": "{game}のスクリーンショット",
      "{n} s": "{n} 秒",
      "photo at {t}": "キー写真 {t}",
      "{n} seconds": "{n} 秒",
    },

    "zh-Hant": {
      "meta.title": "TangoDown – 留住每一個畫面",
      "meta.desc": "TangoDown 會在 XBOX 網路刪除你的 XBOX 螢幕擷取畫面和遊戲短片之前，把它們存到你的 Mac，再備份到 iCloud雲碟、Google 雲端硬碟、Dropbox、NAS 或 WebDAV。",
      "meta.ogDesc": "XBOX 網路會在 90 天後刪除你的擷取。TangoDown 會把每一個都存到你的 Mac，再備份到你平常存放檔案的地方。",
      "skip": "跳至內容",
      "nav.home": "TangoDown，回到頁首",
      "nav.sections": "本頁導覽",
      "nav.menu": "選單",
      "nav.overview": "概覽",
      "nav.backups": "備份",
      "nav.library": "圖庫",
      "nav.design": "設計",
      "nav.live": "原況照片",
      "nav.details": "細節",
      "nav.download": "下載",
      "lang.label": "語言",

      "hero.eyebrow": "Mac 版 TangoDown",
      "hero.title": "留住每一個{target}",
      "hero.word": "畫面",
      "hero.lead": "XBOX 網路會在上傳滿 90 天後，刪除你的螢幕擷取畫面和遊戲短片。<strong>TangoDown 會將每一份都存到你的 Mac，再備份到你平常存放檔案的地方。</strong>",
      "hero.cta": "下載 Mac 版",
      "hero.more": "了解運作方式",
      "fine": "版本 {version} · macOS {macos} 或以上版本",
      "hero.alt": "TangoDown 的主視窗：側邊欄列出各款遊戲及其在 XBOX 上的圖像，旁邊是由螢幕擷取畫面和遊戲短片組成的網格。",

      "ov.line1": "每個{pill}精彩瞬間",
      "ov.line2": "從 XBOX{pill}<span class=\"ov-punct\">，</span>",
      "ov.line3": "{pill}直達你的 Mac。",
      "ov.lead": "TangoDown 會向 XBOX 網路查詢新的螢幕擷取畫面和遊戲短片，並把它們帶回你的 Mac。<strong>接著再備份到你選擇的地方。</strong>",
      "ov.found": "發現。",
      "ov.foundText": "每隔 10 分鐘，或依照你設定的頻率，TangoDown 就會向 XBOX 網路查詢尚未收錄的螢幕擷取畫面和遊戲短片。",
      "ov.saved": "下載。",
      "ov.savedText": "啟用「自動下載新擷取」後，就會<span class=\"nowrap\">直接</span>存到你的 Mac，<span class=\"nowrap\">連按一下都不用。</span>",
      "ov.filed": "歸檔。",
      "ov.filedText": "依遊戲和月份分別放進檔案夾，檔名一看就懂。",
      "ov.copied": "備份。",
      "ov.copiedText": "接著，你加入的每個備份位置都會各自存一份，讓你的遊戲回憶更加堅固。",
      "dest.icloud": "iCloud<wbr><span class=\"nowrap\">雲碟</span>",
      "dest.gdrive": "Google 雲端硬碟",

      "nt.title": "提醒。",
      "nt.lede": "如果某個擷取在 XBOX 刪除前一週還沒存到你的 Mac，TangoDown 就會提醒你，到期前三天再提醒一次。",
      "nt.day1": "第 1 天",
      "nt.day90": "第 90 天",
      "nt.banner": "來自 TangoDown 的通知",
      "close": "關閉",
      "nt.head": "3 個即將到期的擷取",
      "nt.week": "第一個擷取將在 7 天後達到 XBOX 的 90 天期限。",
      "nt.last": "第一個擷取將在 3 天後達到 XBOX 的 90 天期限。",
      "nt.download": "下載",

      "bk.eyebrow": "備份",
      "bk.title": "每個地方，<wbr>都有一份",
      "bk.lead": "加入 iCloud雲碟、Google 雲端硬碟、Dropbox{fn}、NAS 或任何 WebDAV 伺服器，TangoDown 就會把你的擷取分別拷貝過去。<strong>它們都是一般檔案，依你 Mac 上的檔案夾原樣存放。</strong>",
      "bk.tabs": "備份位置",
      "bk.icloudH": "iCloud雲碟<wbr>或任何檔案夾",
      "bk.icloudP": "iCloud雲碟、外接磁碟、Mac 上的檔案夾。只要能在 Finder 中選取，TangoDown 就能備份過去。",
      "bk.gdriveP": "透過 Google 自家的 API 直接上傳到你的雲端硬碟，並以你在自己的 Google Cloud 帳戶中建立的 App 登入。不與他人共用，也沒有任何中間人。{fn}",
      "bk.dropboxP": "拷貝到你 Dropbox 中的 App 檔案夾，並以你自己的 Dropbox App 登入。{fn}",
      "bk.nasH": "NAS<wbr>（SMB 協定）",
      "bk.nasP": "自動找到網路上的 NAS 並直接拷貝，完全不必裝載。Synology、QNAP、Windows 或另一部 Mac 都可以。拷貝中斷時，只要伺服器支援，就能從中斷處接續。",
      "bk.webdavP": "Nextcloud、NAS 的 WebDAV 服務，或任何你能登入的 WebDAV 伺服器。",
      "bk.fact1H": "什麼放哪裡，由你決定",
      "bk.fact1P": "每個備份位置只接收你選定的類型、遊戲和日期，並可設定檔案大小上限。",
      "bk.fact2H": "是備份，不是鏡像",
      "bk.fact2P": "從 Mac 移除下載項目後，它的備份仍會原封不動地留著。",
      "bk.fact3H": "查過一遍，才真正放心",
      "bk.fact3P": "「檢查備份」會逐一詢問各個備份位置，確認你的檔案是否真的還在。",
      "bk.alt": "TangoDown 中某個 NAS 備份位置的頁面，正在選擇它要接收的擷取類型、遊戲和日期。",

      "lib.eyebrow": "圖庫",
      "lib.title": "用起來，<wbr>就像 Mac 內建的一樣",
      "lib.lead": "每個擷取都依遊戲分類，側邊欄裡每款遊戲都附有 XBOX 上的圖像。按一下、按住 Shift 或 ⌘ 再按一下，或直接拖移來選取；按右鍵即可打開選單。<strong>會用 Finder，就會用 TangoDown。</strong>",
      "lib.video": "螢幕錄影：在 TangoDown 中選取擷取、按空白鍵打開、逐一切換到遊戲短片，並顯示其資訊。",
      "lib.t1H": "按空白鍵，立即查看",
      "lib.t1P": "任何擷取都能以完整大小打開。選取多個時，按 ← 和 → 只會在所選項目之間切換。",
      "lib.t2H": "你的遊戲，你來排序",
      "lib.t2P": "在側邊欄中拖移遊戲，就能依你喜歡的順序排列。新遊戲會加在最後面。",
      "lib.t3H": "想看什麼，一找就到",
      "lib.t3P": "既能依遊戲名稱搜尋，也能只顯示已下載、未下載或失敗的項目。",

      "ds.eyebrow": "設計",
      "ds.title": "每一幀，<wbr>都見巧思",
      "ds.lead": "以 SwiftUI 原生打造，處處融入 Liquid Glass 設計。<strong>細微之處，和主要功能同樣講究。來試試其中幾個。</strong>",
      "amb.title": "由你的遊戲點亮",
      "amb.text": "每個擷取都有自己的氛圍。它的色彩在畫面周圍柔和映照，並隨著遊戲短片播放而流轉，就像螢幕照亮昏暗的房間。",
      "amb.switch": "氛圍背景",
      "amb.stillAlt": "Monster Hunter Stories 2: Wings of Ruin 螢幕擷取畫面",
      "amb.picks": "擷取",
      "rf.title": "重新整理，煥然一新",
      "rf.text": "按一下即可向 XBOX 查詢新的擷取。查詢時，箭頭會散成一顆顆小珠，最後再聚攏畫出結果。",
      "rf.result": "結果",
      "rf.success": "成功",
      "rf.error": "錯誤",
      "rf.actual": "實際大小",
      "rs.title": "調整大小，流暢重排",
      "rs.text": "把視窗拉寬或縮窄，每個擷取都會滑順地移到新位置，<span class=\"nowrap\">不論跨越多少欄。</span>",
      "rs.video": "螢幕錄影：調整視窗大小時，TangoDown 的圖庫隨之重新排列。",

      "lp.eyebrow": "原況照片",
      "lp.title": "讓最精彩的時刻，<wbr>再次動起來",
      "lp.lead": "從任何已下載的遊戲短片中選取最多 10 秒，再選一格畫面做為照片。<strong>用 AirDrop 直接傳到 iPhone，就會以原況照片的形式送達，連聲音都在。按住即可重溫那一刻，也能分享到任何支援<span class=\"nowrap\">原況照片的社群 App。</span></strong>{fn}",
      "lp.phone": "按住以播放原況照片",
      "lp.badge": "原況照片",
      "lp.editor": "原況照片編輯器",
      "lp.start": "開始",
      "lp.end": "結束",
      "lp.photo": "主要照片",
      "lp.hint": "拖移黃色控點來選擇片段，拖移白色外框來選擇照片。然後按住畫面。",

      "dt.title": "還有，<wbr>那些小細節",
      "mb.title": "常駐在選單列",
      "mb.text": "立即查詢、暫停傳輸、查看即將到期的項目。啟用「在登入時打開」後，TangoDown 隨時待命，卻絕不打擾。",
      "mb.time": "4月3日 週五  07:55",
      "sc.unit": "分鐘",
      "sc.title": "查詢頻率，隨你設定",
      "sc.text": "TangoDown 每 10 分鐘向 XBOX 查詢一次。最短可每 5 分鐘，最長可每 <span class=\"nowrap\">6 小時。</span>",
      "cl.name": "XBOX 雲端",
      "cl.free": "6.85 GB 可用",
      "cl.title": "雲端還剩多少，心裡有數",
      "cl.text": "XBOX 雲端儲存空間還剩<span class=\"nowrap\">多少{fn}，</span><span class=\"nowrap\">就顯示在側邊欄最下方。</span>",
      "ac.title": "所有傳輸，盡在一處",
      "ac.text": "下載與拷貝，速度和進度一目瞭然。可以單獨或全部暫停、繼續或重試。",
      "ac.alt": "TangoDown 的「活動」表格：下載與拷貝的進度和備份位置。",
      "sp.title": "騰出空間",
      "sp.text": "「移除已備份的下載項目」會從 Mac 清除備份位置已有的檔案。想確認一下的話，可以先執行「檢查備份」。",
      "pv.title": "沒有中間人",
      "pv.text": "沒有 TangoDown 帳號，也沒有 TangoDown 伺服器。擷取從 XBOX 到你的 Mac，再到你的備份位置，所有登入資訊都由 Mac 的 Secure Enclave 加密保護。",
      "lg.list": "語言",
      "lg.title": "說你的語言",
      "lg.text": "TangoDown 會跟隨 Mac 的語言，也可以自行選擇。不論哪種語言，檔案夾和檔案名稱都保持不變。",
      "ax.title": "為每個人而設計",
      "ax.text": "旁白會讀出每個擷取的遊戲、類型、長度和日期。完整支援鍵盤操作，也遵循「減少透明度」、「減少動態效果」和「增加對比」設定。",

      "dl.alt": "TangoDown App 圖像",
      "dl.title": "只需設定一次",
      "dl.lead": "登入 XBOX，其餘交給 TangoDown。",
      "dl.cta": "下載 TangoDown",
      "fo.summary": "第一次打開 TangoDown",
      "fo.p1": "TangoDown 未經 Apple 公證，因此 macOS 會請你確認一次。",
      "fo.s1": "將 TangoDown 移到「應用程式」檔案夾並按兩下。macOS 顯示無法驗證 TangoDown 時，按一下「完成」。",
      "fo.s2": "打開「系統設定」›「隱私權與安全性」。在「安全性」下方 TangoDown 相關訊息旁，按一下「強制打開」，然後確認。",
      "fo.p2": "之後，TangoDown 就能像其他 App 一樣打開。安裝新版本後，請再執行一次相同步驟。",

      "fn.1": "Google 雲端硬碟和 Dropbox 是透過你在自己的 Google Cloud 或 Dropbox 帳戶中建立的 App 登入，因此不會與任何人共用 App、配額或登入資訊。逐步指南位於 TangoDown 的「輔助說明」選單中，設定大約只需 10 分鐘。 {back}",
      "fn.2": "由遊戲短片製作的原況照片，可在 iPhone 和 Mac 的「照片」中播放。iOS 僅支援將內建相機拍攝的原況照片設為動態鎖定畫面背景圖片。 {back}",
      "fn.3": "XBOX 網路最多保留 10 GB 已上傳的擷取。由於 XBOX 網路不會回報上限，TangoDown 以 XBOX 支援提供的數字為準。 {back}",
      "fn.back": "回到內文",
      "fn.ref1": "註 1",
      "fn.ref2": "註 2",
      "fn.ref3": "註 3",
      "ft.legal": "TangoDown 與 Microsoft 或 XBOX 並無關聯。XBOX 是 Microsoft 集團旗下公司的商標。",

      "3 captures downloaded.": "已下載 3 個擷取。",
      "Copy to {name}": "備份到{name}",
      "Play": "播放",
      "Replay": "重新播放",
      "Check with XBOX Now": "立即向 XBOX 查詢",
      "Checking with XBOX": "正在向 XBOX 查詢",
      "Up to Date": "已是最新",
      "Couldn’t Reach XBOX": "無法連接 XBOX",
      "{game} screenshot": "{game}螢幕擷取畫面",
      "{n} s": "{n} 秒",
      "photo at {t}": "主要照片 {t}",
      "{n} seconds": "{n} 秒",
    },

    "zh-Hans": {
      "meta.title": "TangoDown – 留住每一个画面",
      "meta.desc": "TangoDown 会在 XBOX 网络删除你的 XBOX 屏幕截图和游戏剪辑之前，把它们保存到你的 Mac，再备份到 iCloud云盘、Google 云端硬盘、Dropbox、NAS 或 WebDAV。",
      "meta.ogDesc": "XBOX 网络会在 90 天后删除你的捕获。TangoDown 会把每一个都保存到你的 Mac，再备份到你平时存放文件的地方。",
      "skip": "跳至内容",
      "nav.home": "TangoDown，返回顶部",
      "nav.sections": "本页导航",
      "nav.menu": "菜单",
      "nav.overview": "概览",
      "nav.backups": "备份",
      "nav.library": "图库",
      "nav.design": "设计",
      "nav.live": "实况照片",
      "nav.details": "细节",
      "nav.download": "下载",
      "lang.label": "语言",

      "hero.eyebrow": "Mac 版 TangoDown",
      "hero.title": "留住每一个{target}",
      "hero.word": "画面",
      "hero.lead": "XBOX 网络会在上传满 90 天后，删除你的屏幕截图和游戏剪辑。<strong>TangoDown 会将每一份都保存到你的 Mac，再备份到你平时存放文件的地方。</strong>",
      "hero.cta": "下载 Mac 版",
      "hero.more": "了解运作方式",
      "fine": "版本 {version} · macOS {macos} 或更高版本",
      "hero.alt": "TangoDown 的主窗口：边栏列出各款游戏及其在 XBOX 上的图标，旁边是由屏幕截图和剪辑组成的网格。",

      "ov.line1": "每个{pill}精彩瞬间",
      "ov.line2": "从 XBOX{pill}<span class=\"ov-punct\">，</span>",
      "ov.line3": "{pill}直达你的 Mac。",
      "ov.lead": "TangoDown 会检查 XBOX 网络上新的屏幕截图和游戏剪辑，并把它们带回你的 Mac。<strong>然后再备份到你选择的位置。</strong>",
      "ov.found": "发现。",
      "ov.foundText": "每隔 10 分钟，或按照你设定的频率，TangoDown 就会检查 XBOX 网络上是否有尚未收录的屏幕截图和剪辑。",
      "ov.saved": "下载。",
      "ov.savedText": "开启“自动下载新捕获”后，就会直接保存到你的 Mac，<span class=\"nowrap\">全程无需你动手。</span>",
      "ov.filed": "归档。",
      "ov.filedText": "按游戏和月份分别放进文件夹，文件名一看就懂。",
      "ov.copied": "备份。",
      "ov.copiedText": "接着，你添加的每个备份位置都会各存一份，让你的游戏回忆更加坚固。",
      "dest.icloud": "iCloud<wbr><span class=\"nowrap\">云盘</span>",
      "dest.gdrive": "Google 云端硬盘",

      "nt.title": "提醒。",
      "nt.lede": "如果某个捕获在 XBOX 删除前一周还没保存到你的 Mac，TangoDown 会提醒你，到期前三天再提醒一次。",
      "nt.day1": "第 1 天",
      "nt.day90": "第 90 天",
      "nt.banner": "来自 TangoDown 的通知",
      "close": "关闭",
      "nt.head": "3 个捕获即将过期",
      "nt.week": "第一个将在 7 天后达到 XBOX 的 90 天期限。",
      "nt.last": "第一个将在 3 天后达到 XBOX 的 90 天期限。",
      "nt.download": "下载",

      "bk.eyebrow": "备份",
      "bk.title": "每个地方，<wbr>都有一份",
      "bk.lead": "添加 iCloud云盘、Google 云端硬盘、Dropbox{fn}、NAS 或任意 WebDAV 服务器，TangoDown 就会把你的捕获分别拷贝过去。<strong>它们都是普通文件，按你 Mac 上的文件夹原样存放。</strong>",
      "bk.tabs": "备份位置",
      "bk.icloudH": "iCloud云盘<wbr>或任意文件夹",
      "bk.icloudP": "iCloud云盘、外置磁盘、Mac 上的文件夹。只要能在访达中选取，TangoDown 就能备份过去。",
      "bk.gdriveP": "通过 Google 自家的 API 直接上传到你的云端硬盘，并用你在自己的 Google Cloud 账户中创建的 App 登录。不与他人共享，也没有任何中间人。{fn}",
      "bk.dropboxP": "拷贝到你 Dropbox 中的 App 文件夹，并用你自己的 Dropbox App 登录。{fn}",
      "bk.nasH": "NAS<wbr>（SMB 协议）",
      "bk.nasP": "自动找到网络上的 NAS 并直接拷贝，完全无需装载。Synology、QNAP、Windows 或另一台 Mac 都可以。拷贝中断后，只要服务器支持，就能从中断处继续。",
      "bk.webdavP": "Nextcloud、NAS 的 WebDAV 服务，或任何你能登录的 WebDAV 服务器。",
      "bk.fact1H": "什么放哪里，由你决定",
      "bk.fact1P": "每个备份位置只接收你选定的内容类型、游戏和日期，还可以设定文件大小上限。",
      "bk.fact2H": "是备份，不是镜像",
      "bk.fact2P": "从 Mac 移除下载项后，它的备份依然原样保留。",
      "bk.fact3H": "查过一遍，才真正放心",
      "bk.fact3P": "“检查备份”会逐一询问每个备份位置，确认你的文件是否真的还在。",
      "bk.alt": "TangoDown 中某个 NAS 备份位置的页面，正在选择它要接收的捕获类型、游戏和日期。",

      "lib.eyebrow": "图库",
      "lib.title": "用起来，<wbr>就像 Mac 自带的一样",
      "lib.lead": "每个捕获都按游戏归类，边栏里每款游戏都配有 XBOX 上的图标。点按、按住 Shift 或 ⌘ 点按，或者拖移来选择；右键点按即可打开菜单。<strong>会用访达，就会用 TangoDown。</strong>",
      "lib.video": "屏幕录制：在 TangoDown 中选择捕获、按空格键打开、逐个切换到剪辑，并显示其简介。",
      "lib.t1H": "按空格键，立即查看",
      "lib.t1P": "任何捕获都能以全尺寸打开。选中多个时，按 ← 和 → 只会在所选项目中切换。",
      "lib.t2H": "你的游戏，你来排序",
      "lib.t2P": "在边栏中拖移游戏，就能按你喜欢的顺序排列。新游戏会排在最后。",
      "lib.t3H": "想看什么，一找就到",
      "lib.t3P": "既能按游戏名称搜索，也能只显示已下载、未下载或失败的项目。",

      "ds.eyebrow": "设计",
      "ds.title": "每一帧，<wbr>都见巧思",
      "ds.lead": "采用 SwiftUI 原生打造，处处融入 Liquid Glass 设计。<strong>细微之处，和主要功能同样讲究。来试试其中几个。</strong>",
      "amb.title": "由你的游戏点亮",
      "amb.text": "每个捕获都有自己的氛围。它的色彩在画面周围柔和映照，并随着剪辑的播放而流转，就像屏幕照亮昏暗的房间。",
      "amb.switch": "氛围背景",
      "amb.stillAlt": "Monster Hunter Stories 2: Wings of Ruin 屏幕截图",
      "amb.picks": "捕获",
      "rf.title": "刷新，焕然一新",
      "rf.text": "点按即可检查 XBOX 上有没有新的捕获。检查时，箭头会散成一颗颗小珠，最后再聚拢画出结果。",
      "rf.result": "结果",
      "rf.success": "成功",
      "rf.error": "错误",
      "rf.actual": "实际大小",
      "rs.title": "调整大小，流畅重排",
      "rs.text": "把窗口拉宽或缩窄，每个捕获都会顺滑地移到新位置，<span class=\"nowrap\">无论跨过多少列。</span>",
      "rs.video": "屏幕录制：调整窗口大小时，TangoDown 的图库随之重新排列。",

      "lp.eyebrow": "实况照片",
      "lp.title": "让最精彩的时刻，<wbr>再次动起来",
      "lp.lead": "从任意已下载的剪辑中选取最多 10 秒，再选一帧作为照片。<strong>用隔空投送直接传到 iPhone，就会以实况照片的形式送达，声音也一并保留。按住即可重温那一刻，也能分享到任何支持<span class=\"nowrap\">实况照片的社交 App。</span></strong>{fn}",
      "lp.phone": "按住以播放实况照片",
      "lp.badge": "实况",
      "lp.editor": "实况照片编辑器",
      "lp.start": "开始",
      "lp.end": "结束",
      "lp.photo": "封面照片",
      "lp.hint": "拖移黄色控制柄选择片段，拖移白色边框选择照片。然后按住画面。",

      "dt.title": "还有，<wbr>那些小细节",
      "mb.title": "常驻菜单栏",
      "mb.text": "立即检查、暂停传输、查看即将过期的项目。开启“登录时打开”后，TangoDown 随时待命，却从不打扰。",
      "mb.time": "4月3日 周五  07:55",
      "sc.unit": "分钟",
      "sc.title": "检查频率，随你设定",
      "sc.text": "TangoDown 每 10 分钟检查一次 XBOX。最短可每 5 分钟一次，最长可每 6 小时一次。",
      "cl.name": "XBOX 云端",
      "cl.free": "6.85 GB 可用",
      "cl.title": "云端还剩多少，心中有数",
      "cl.text": "XBOX 云存储空间还剩<span class=\"nowrap\">多少{fn}，</span><span class=\"nowrap\">就显示在边栏最下方。</span>",
      "ac.title": "所有传输，尽在一处",
      "ac.text": "下载与拷贝，速度和进度一目了然。可以单个或一次全部暂停、继续或重试。",
      "ac.alt": "TangoDown 的“活动”表格：下载与拷贝的进度和备份位置。",
      "sp.title": "腾出空间",
      "sp.text": "“移除已备份的下载项”会从 Mac 上清除备份位置已有的文件。想确认一下的话，可以先运行“检查备份”。",
      "pv.title": "没有中间人",
      "pv.text": "没有 TangoDown 账户，也没有 TangoDown 服务器。捕获从 XBOX 到你的 Mac，再到你的备份位置，所有登录信息都由 Mac 的 Secure Enclave 加密保护。",
      "lg.list": "语言",
      "lg.title": "说你的语言",
      "lg.text": "TangoDown 会跟随 Mac 的语言，也可以自行选择。无论哪种语言，文件夹和文件名都保持不变。",
      "ax.title": "为每个人而设计",
      "ax.text": "旁白会读出每个捕获的游戏、类型、时长和日期。完全支持键盘操作，也遵从“降低透明度”“减弱动态效果”和“增强对比度”设置。",

      "dl.alt": "TangoDown App 图标",
      "dl.title": "只需设置一次",
      "dl.lead": "登录 XBOX，剩下的交给 TangoDown。",
      "dl.cta": "下载 TangoDown",
      "fo.summary": "首次打开 TangoDown",
      "fo.p1": "TangoDown 未经 Apple 公证，因此 macOS 会请你确认一次。",
      "fo.s1": "将 TangoDown 移到“应用程序”文件夹并连按图标。macOS 提示无法验证 TangoDown 时，点按“完成”。",
      "fo.s2": "打开“系统设置”›“隐私与安全”。在“安全性”下方有关 TangoDown 的信息旁，点按“仍要打开”，然后确认。",
      "fo.p2": "之后，TangoDown 就能像其他 App 一样打开。安装新版本后，请再执行一次相同步骤。",

      "fn.1": "Google 云端硬盘和 Dropbox 通过你在自己的 Google Cloud 或 Dropbox 账户中创建的 App 登录，因此不会与任何人共享 App、配额或登录信息。分步指南位于 TangoDown 的“帮助”菜单中，完成设置大约只需 10 分钟。 {back}",
      "fn.2": "由剪辑制作的实况照片，可在 iPhone 和 Mac 的“照片”中播放。iOS 仅支持将自带相机拍摄的实况照片设为动态锁定屏幕墙纸。 {back}",
      "fn.3": "XBOX 网络最多保留 10 GB 已上传的捕获。由于 XBOX 网络不提供上限数据，TangoDown 以 XBOX 支持给出的数字为准。 {back}",
      "fn.back": "返回正文",
      "fn.ref1": "注 1",
      "fn.ref2": "注 2",
      "fn.ref3": "注 3",
      "ft.legal": "TangoDown 与 Microsoft 或 XBOX 无关联。XBOX 是 Microsoft 集团旗下公司的商标。",

      "3 captures downloaded.": "已下载 3 个捕获。",
      "Copy to {name}": "备份到{name}",
      "Play": "播放",
      "Replay": "重新播放",
      "Check with XBOX Now": "立即检查 XBOX",
      "Checking with XBOX": "正在检查 XBOX",
      "Up to Date": "已是最新",
      "Couldn’t Reach XBOX": "无法连接 XBOX",
      "{game} screenshot": "{game}屏幕截图",
      "{n} s": "{n} 秒",
      "photo at {t}": "封面照片 {t}",
      "{n} seconds": "{n} 秒",
    },
  };

  /* The engine ------------------------------------------------------------------------ */

  const root = document.documentElement;
  const nameLabel = document.querySelector(".lang-switch .lang-name");
  const langOptions = [...document.querySelectorAll(".lang-option[data-lang]")];
  const textEls = [...document.querySelectorAll("[data-i18n]")];
  const attrEls = [...document.querySelectorAll("[data-i18n-attr]")];
  const english = {};
  const slots = new Map(); // element → {name: the child kept in place}
  const listeners = [];
  let lang = "en";

  const pairs = (el) =>
    el.dataset.i18nAttr.split(";").map((pair) => pair.split(":").map((part) => part.trim())).filter((pair) => pair.length === 2);

  // English, from the page as it was written.
  for (const el of textEls) {
    const kept = el.querySelectorAll("[data-slot]");
    if (kept.length) {
      const own = {};
      const copy = el.cloneNode(true);
      kept.forEach((child) => (own[child.dataset.slot] = child));
      copy.querySelectorAll("[data-slot]").forEach((child) => child.replaceWith(`{${child.dataset.slot}}`));
      slots.set(el, own);
      english[el.dataset.i18n] ??= copy.innerHTML;
    } else {
      english[el.dataset.i18n] ??= el.innerHTML;
    }
  }
  for (const el of attrEls) for (const [attr, key] of pairs(el)) english[key] ??= el.getAttribute(attr) || "";

  const lookup = (key) => {
    const table = STRINGS[lang];
    return table && key in table ? table[key] : english[key] ?? key;
  };

  const fill = (el, html) => {
    if (el.tagName === "TITLE") return void (el.textContent = html);
    const own = slots.get(el);
    if (!own) return void (el.innerHTML = html);
    el.innerHTML = html.replace(/\{(\w+)\}/g, (match, name) => (own[name] ? `<i data-slot-at="${name}"></i>` : match));
    el.querySelectorAll("[data-slot-at]").forEach((at) => at.replaceWith(own[at.dataset.slotAt]));
  };

  // A word or number set into Japanese or Chinese gets a half-width space where Latin text meets the script.
  const LATIN = /[A-Za-z0-9]/;
  const HAN = /[぀-ヿ㐀-鿿豈-﫿]/;
  const t = (key, vars) => {
    const table = STRINGS[lang];
    const template = table && key in table ? table[key] : key;
    if (!vars) return template;
    const cjk = CJK.test(lang);
    return template.replace(/\{(\w+)\}/g, (match, name, at) => {
      if (!(name in vars)) return match;
      let value = String(vars[name]);
      if (cjk) {
        const before = template[at - 1], after = template[at + match.length];
        if (before && HAN.test(before) && LATIN.test(value[0])) value = " " + value;
        if (after && HAN.test(after) && LATIN.test(value[value.length - 1])) value += " ";
      }
      return value;
    });
  };

  // Numbers as each language writes them: 3,0 in French and German.
  const num = (n, digits = 0) =>
    new Intl.NumberFormat(lang, { minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: false }).format(n);

  const syncPicker = () => {
    if (nameLabel) nameLabel.textContent = LANGUAGES[lang];
    for (const option of langOptions) option.setAttribute("aria-selected", String(option.dataset.lang === lang));
  };

  const apply = (next) => {
    lang = next;
    root.lang = lang;
    for (const el of textEls) {
      const html = lookup(el.dataset.i18n);
      if (el.i18nShown === html) continue;
      el.i18nShown = html;
      fill(el, html);
    }
    for (const el of attrEls) for (const [attr, key] of pairs(el)) el.setAttribute(attr, lookup(key));
    syncPicker();
    for (const fn of listeners) fn(lang);
  };

  // A choice made here sticks, and the address names it so a link opens in the same language.
  const set = (next) => {
    if (!(next in LANGUAGES)) return;
    try {
      localStorage.setItem(STORE, next);
    } catch (e) {}
    try {
      const url = new URL(location.href);
      if (next === "en") url.searchParams.delete("lang");
      else url.searchParams.set("lang", next);
      history.replaceState(history.state, "", url);
    } catch (e) {}
    if (next !== lang) apply(next);
  };

  window.TDi18n = {
    get lang() {
      return lang;
    },
    t,
    num,
    set,
    onChange: (fn) => listeners.push(fn),
  };

  const start = root.lang in LANGUAGES ? root.lang : "en";
  if (start === "en") {
    syncPicker();
  } else {
    apply(start);
  }
  root.classList.remove("i18n-wait");
})();
