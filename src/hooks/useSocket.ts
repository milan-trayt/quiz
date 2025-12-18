'use client';

import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';

let socket: Socket | null = null;

export function useSocket(quizId: string) {
  const router = useRouter();

  useEffect(() => {
    if (!socket) {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
      socket = io(socketUrl);
      console.log('Socket initialized:', socketUrl);
    }

    socket.emit('join-quiz', quizId);
    console.log('Joined quiz:', quizId);

    const handleUpdate = () => {
      console.log('Received quiz-update, refreshing...');
      router.refresh();
    };

    socket.on('quiz-update', handleUpdate);

    return () => {
      socket?.off('quiz-update', handleUpdate);
    };
  }, [quizId, router]);

  return socket;
}
