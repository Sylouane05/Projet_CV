// Fictional data with a volume comparable to the owner's CV. No personal information.
module.exports = function resumeFixture() {
  const skillGroups = {
    "Bases de données": ["MySQL", "PostgreSQL"],
    "Électronique et IoT": ["LabVIEW", "LTspice", "STM32CubeIDE"],
    "Gestion de projet": ["Cycle en V", "Méthode agile"],
    "Intelligence artificielle": ["Edge Impulse", "Évaluation de modèles", "Google Colab", "PyTorch", "TensorFlow"],
    "Outils et plateformes": ["GitHub", "Suite bureautique"],
    "Programmation et web": ["C", "C++", "HTML/CSS", "Java", "Python", "VS Code"],
  };
  const skills = Object.entries(skillGroups).flatMap(([domain, names]) => names.map((name, index) => ({ id: `${domain}-${index}`, name, domain })));
  const experiences = [
    { id: "exp1", title: "Stage application ingénieur", company: "Laboratoire de recherche", location: "Lyon", startDate: "2025-06", endDate: "2025-09", bullets: ["Évaluer la capacité d’un radar à ondes continues modulées en fréquence à caractériser l’activité mécanique du système cardiovasculaire et documenter les résultats expérimentaux."] },
    { id: "exp2", title: "Technicien informatique", company: "Atelier de réparation", location: "Lyon", startDate: "2024-09", endDate: "2025-06", bullets: ["Diagnostic et réparation matérielle : identifier les pannes de mémoire, de disque ou d’alimentation, remplacer les composants et remettre en état les ordinateurs défectueux.", "Installation et configuration de systèmes d’exploitation : déployer Windows, installer les pilotes et configurer les logiciels essentiels pour les utilisateurs."] },
  ];
  const projects = [
    { id: "pr1", name: "Bureau d’étude — Assistant embarqué", startDate: "2025-10", endDate: "2026-03", bullets: ["Concevoir un système d’intelligence artificielle embarquée qui accompagne des personnes en situation de handicap dans la gestion de leur emploi du temps, avec reconnaissance d’images, de la voix et des mouvements."] },
    { id: "pr2", name: "Projet de recherche — Bio-impédance", startDate: "2024-09", endDate: "2025-06", bullets: ["Caractériser des propriétés de la peau, dont le niveau d’hydratation, grâce à la spectroscopie d’impédance.", "Modéliser les circuits de mesure avec le logiciel LTspice.", "Réaliser une classification à l’aide d’un réseau de neurones."] },
    { id: "pr3", name: "Sécurité des objets connectés", startDate: "2026-01", endDate: "2026-01", bullets: ["Récupérer les données d’un capteur sur une carte STM32.", "Transmettre les données à un serveur en TCP/IP de façon sécurisée au moyen d’un chiffrement asymétrique.", "Transmettre les données du serveur à un client en utilisant un certificat pour sécuriser la communication."] },
    { id: "pr4", name: "Moteur d’inférence", startDate: "2024-03", endDate: "2024-03", bullets: ["Mettre en œuvre un moteur capable de déduire de nouvelles connaissances à l’aide du chaînage avant et du chaînage arrière."] },
  ];
  return {
    profile: { fullName: "Alexandre Camille Dupont-Rivière", headline: "Étudiant ingénieur — Recherche stage de fin d’études (6 mois)", city: "Lyon, 69000", mobility: "Lyon, Nantes et alentours", email: "alexandre-camille.dupont-riviere@example.org", phone: "06 00 00 00 00", linkedinUsername: "profil-de-demonstration", summary: "Étudiant ingénieur spécialisé en électronique et en santé numérique. Recherche un stage de fin d’études technique de six mois. Souhaite appliquer ses compétences en électronique, en développement logiciel et en analyse de données dans un environnement professionnel.",
      education: [{ id: "ed1", school: "École préparatoire scientifique", degree: "Classe préparatoire MPSI", startDate: "2021", endDate: "2023", city: "Nantes" }, { id: "ed2", school: "Institut supérieur d’ingénierie", degree: "Cycle ingénieur", startDate: "2023", endDate: "2026", city: "Lyon" }],
      languages: [{ id: "fr", name: "Français", level: "Natif" }, { id: "en", name: "Anglais", level: "B1" }], certifications: [{ id: "cert1", name: "Évaluation des connaissances en développement durable", issuer: "Organisme de formation", year: "2025" }],
    }, experiences, projects, skills,
    hobbies: [{ id: "h1", name: "Lecture" }, { id: "h2", name: "Jeux vidéo" }, { id: "h3", name: "Cuisine" }],
    resumeVariants: [{ id: "demo", name: "CV démonstration", selectedExperienceIds: experiences.map((e) => e.id), selectedProjectIds: projects.map((e) => e.id), selectedSkillIds: skills.map((e) => e.id) }],
  };
};
