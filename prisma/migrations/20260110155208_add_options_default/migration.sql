-- CreateTable
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'setup',
    "round" TEXT NOT NULL DEFAULT 'not_started',
    "phase" TEXT NOT NULL DEFAULT 'waiting',
    "currentTeamId" TEXT,
    "currentQuestionId" TEXT,
    "selectedDomainId" TEXT,
    "timerEndsAt" TIMESTAMP(3),
    "buzzSequence" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "domainSelectingTeam" INTEGER NOT NULL DEFAULT 0,
    "questionsInDomain" INTEGER NOT NULL DEFAULT 0,
    "usedDomains" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "totalDomainRounds" INTEGER NOT NULL DEFAULT 0,
    "completedDomainRounds" INTEGER NOT NULL DEFAULT 0,
    "domainIndex" INTEGER NOT NULL DEFAULT 0,
    "answerTurnIndex" INTEGER NOT NULL DEFAULT 0,
    "questionSelectorIndex" INTEGER NOT NULL DEFAULT 0,
    "pendingBuzzerAnswers" JSONB DEFAULT '{}',
    "buzzTimers" JSONB DEFAULT '{}',
    "lastRoundResults" JSONB DEFAULT '{}',
    "lastDomainAnswer" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Snapshot" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuzzerQuestion" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "options" TEXT[],
    "quizId" TEXT NOT NULL,
    "isAnswered" BOOLEAN NOT NULL DEFAULT false,
    "passedFrom" TEXT,

    CONSTRAINT "BuzzerQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "captainName" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "quizId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Domain" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,

    CONSTRAINT "Domain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "options" TEXT[],
    "domainId" TEXT NOT NULL,
    "isAnswered" BOOLEAN NOT NULL DEFAULT false,
    "passedFrom" TEXT,
    "attemptedBy" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "selectedBy" TEXT,
    "correctAnswer" TEXT,
    "optionsViewed" BOOLEAN NOT NULL DEFAULT false,
    "optionsDefault" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Snapshot" ADD CONSTRAINT "Snapshot_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuzzerQuestion" ADD CONSTRAINT "BuzzerQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Domain" ADD CONSTRAINT "Domain_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;
