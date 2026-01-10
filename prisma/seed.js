const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  const quiz = await prisma.quiz.create({ 
    data: {
      status: 'setup',
      round: 'not_started',
      phase: 'waiting',
    }
  });
  console.log('✅ Quiz created:', quiz.id);

  // Create teams
  const teams = await Promise.all([
    prisma.team.create({ data: { name: 'Team Alpha', quizId: quiz.id, sequence: 0 } }),
    prisma.team.create({ data: { name: 'Team Beta', quizId: quiz.id, sequence: 1 } }),
    prisma.team.create({ data: { name: 'Team Gamma', quizId: quiz.id, sequence: 2 } }),
    prisma.team.create({ data: { name: 'Team Delta', quizId: quiz.id, sequence: 3 } }),
  ]);

  console.log('✅ Teams created:', teams.length);

  const domains = [
    { 
      name: 'Science', 
      questions: [
        { text: 'What is the chemical symbol for gold?', answer: 'Au', options: ['Au', 'Ag', 'Fe', 'Cu'] },
        { text: 'Which of the following planets is known as the Red Planet?', answer: 'Mars', options: ['Mars', 'Venus', 'Jupiter', 'Saturn'], optionsDefault: true },
        { text: 'What is the speed of light in m/s?', answer: '299792458', options: ['299792458', '300000000', 'Infinity', '350000000'] },
        { text: 'What is H2O?', answer: 'Water', options: ['Water', 'Hydrogen', 'Oxygen', 'Peroxide'] },
      ]
    },
    { 
      name: 'History', 
      questions: [
        { text: 'Who was the first President of the USA?', answer: 'George Washington', options: ['George Washington', 'Thomas Jefferson', 'Abraham Lincoln', 'John Adams'] },
        { text: 'In which year did World War II end?', answer: '1945', options: ['1945', '1944', '1946', '1943'] },
        { text: 'Which of the following explorers is credited with discovering America?', answer: 'Christopher Columbus', options: ['Christopher Columbus', 'Amerigo Vespucci', 'Leif Erikson', 'Ferdinand Magellan'], optionsDefault: true },
        { text: 'What year did the Berlin Wall fall?', answer: '1989', options: ['1989', '1990', '1988', '1991'] },
      ]
    },
    { 
      name: 'Geography', 
      questions: [
        { text: 'What is the capital of France?', answer: 'Paris', options: ['Paris', 'London', 'Berlin', 'Madrid'] },
        { text: 'Which is the largest ocean?', answer: 'Pacific', options: ['Pacific', 'Atlantic', 'Indian', 'Arctic'] },
        { text: 'Which of the following is the longest river in the world?', answer: 'Nile', options: ['Nile', 'Amazon', 'Yangtze', 'Mississippi'], optionsDefault: true },
        { text: 'How many continents are there?', answer: '7', options: ['7', '6', '5', '8'] },
      ]
    },
    { 
      name: 'Sports', 
      questions: [
        { text: 'How many players are in a football team on the field?', answer: '11', options: ['11', '10', '12', '9'] },
        { text: 'Where were the first modern Olympics held?', answer: 'Athens', options: ['Athens', 'Paris', 'London', 'Rome'] },
        { text: 'Which of the following sports is played at Wimbledon?', answer: 'Tennis', options: ['Tennis', 'Cricket', 'Football', 'Golf'], optionsDefault: true },
        { text: 'How many rings are in the Olympic symbol?', answer: '5', options: ['5', '4', '6', '7'] },
      ]
    },
  ];

  for (const domain of domains) {
    const d = await prisma.domain.create({
      data: { name: domain.name, quizId: quiz.id },
    });

    for (let i = 0; i < domain.questions.length; i++) {
      await prisma.question.create({
        data: {
          number: i + 1,
          text: domain.questions[i].text,
          answer: domain.questions[i].answer,
          options: domain.questions[i].options,
          optionsDefault: domain.questions[i].optionsDefault || false,
          domainId: d.id,
        },
      });
    }
  }

  console.log('✅ Domains created: 4');

  const buzzerQuestions = [
    { text: 'What is the largest mammal?', answer: 'Blue Whale' },
    { text: 'Who painted the Mona Lisa?', answer: 'Leonardo da Vinci' },
    { text: 'What is the smallest prime number?', answer: '2' },
    { text: 'What is the capital of Japan?', answer: 'Tokyo' },
    { text: 'What does HTML stand for?', answer: 'HyperText Markup Language' },
    { text: 'Which programming language is known as the language of the web?', answer: 'JavaScript' },
    { text: 'What is the most abundant gas in Earth\'s atmosphere?', answer: 'Nitrogen' },
    { text: 'Who wrote Romeo and Juliet?', answer: 'William Shakespeare' },
  ];

  for (let i = 0; i < buzzerQuestions.length; i++) {
    await prisma.buzzerQuestion.create({
      data: {
        number: i + 1,
        text: buzzerQuestions[i].text,
        answer: buzzerQuestions[i].answer,
        options: [],
        quizId: quiz.id,
      },
    });
  }

  console.log('✅ Buzzer questions created:', buzzerQuestions.length);

  console.log('\n🎉 Seed completed successfully!');
  console.log(`\n📋 Quiz ID: ${quiz.id}`);
  console.log(`👥 Teams: ${teams.length}`);
  console.log(`📚 Domains: 4`);
  console.log(`❓ Domain Questions: 16 (4 per domain, 4 multiple choice)`);
  console.log(`⚡ Buzzer Questions: ${buzzerQuestions.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
