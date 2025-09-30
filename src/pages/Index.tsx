import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface Bird {
  y: number;
  velocity: number;
}

interface Obstacle {
  x: number;
  gapY: number;
  passed: boolean;
}

const BIRD_SIZE = 50;
const OBSTACLE_WIDTH = 80;
const GAP_SIZE = 200;
const GRAVITY = 0.6;
const JUMP_FORCE = -10;
const GAME_SPEED = 3;

const Index = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [bird, setBird] = useState<Bird>({ y: 250, velocity: 0 });
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number>();

  const jump = useCallback(() => {
    if (!gameStarted || gameOver) return;
    setBird((prev) => ({ ...prev, velocity: JUMP_FORCE }));
  }, [gameStarted, gameOver]);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setBird({ y: 250, velocity: 0 });
    setObstacles([
      { x: 600, gapY: 200, passed: false },
      { x: 900, gapY: 300, passed: false }
    ]);
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    setBird({ y: 250, velocity: 0 });
    setObstacles([]);
  };

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = () => {
      setBird((prev) => {
        const newVelocity = prev.velocity + GRAVITY;
        const newY = prev.y + newVelocity;

        if (newY <= 0 || newY >= 550) {
          setGameOver(true);
          if (score > highScore) setHighScore(score);
          return prev;
        }

        return { y: newY, velocity: newVelocity };
      });

      setObstacles((prev) => {
        const updated = prev.map((obs) => {
          const newX = obs.x - GAME_SPEED;

          if (!obs.passed && newX + OBSTACLE_WIDTH < 100) {
            setScore((s) => s + 1);
            return { ...obs, x: newX, passed: true };
          }

          return { ...obs, x: newX };
        });

        const filtered = updated.filter((obs) => obs.x > -OBSTACLE_WIDTH);

        if (filtered.length < 2) {
          filtered.push({
            x: 600,
            gapY: Math.random() * 300 + 100,
            passed: false
          });
        }

        filtered.forEach((obs) => {
          const birdLeft = 100;
          const birdRight = 100 + BIRD_SIZE;
          const birdTop = bird.y;
          const birdBottom = bird.y + BIRD_SIZE;

          const obsLeft = obs.x;
          const obsRight = obs.x + OBSTACLE_WIDTH;

          if (birdRight > obsLeft && birdLeft < obsRight) {
            if (birdTop < obs.gapY || birdBottom > obs.gapY + GAP_SIZE) {
              setGameOver(true);
              if (score > highScore) setHighScore(score);
            }
          }
        });

        return filtered;
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameStarted, gameOver, bird.y, score, highScore]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [jump]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0033] via-[#2d0a4e] to-[#1a0033] relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full animate-twinkle"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animationDelay: Math.random() * 2 + 's'
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent mb-4 tracking-wider">
            FLAPPY SPACE BIRD
          </h1>
          <div className="flex justify-center gap-8 text-xl">
            <div className="flex items-center gap-2">
              <Icon name="Trophy" className="text-accent" size={24} />
              <span className="text-white font-bold">Score: {score}</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="Star" className="text-secondary" size={24} />
              <span className="text-white font-bold">High: {highScore}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Card className="bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm border-primary/30 shadow-2xl shadow-primary/20 overflow-hidden">
            <div
              ref={canvasRef}
              className="relative w-[600px] h-[600px] bg-gradient-to-b from-[#0a0015] to-[#1a0033] cursor-pointer"
              onClick={jump}
            >
              {!gameStarted && !gameOver && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/50 backdrop-blur-sm">
                  <div className="text-center space-y-4">
                    <Icon name="Rocket" className="text-accent mx-auto animate-float" size={80} />
                    <p className="text-white/90 text-lg">Click or press SPACE to fly</p>
                  </div>
                  <Button
                    onClick={startGame}
                    size="lg"
                    className="bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 text-white font-bold text-xl px-8 py-6 rounded-full shadow-lg shadow-primary/50 transition-all duration-300 hover:scale-105"
                  >
                    <Icon name="Play" className="mr-2" size={24} />
                    START GAME
                  </Button>
                </div>
              )}

              {gameOver && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/70 backdrop-blur-sm">
                  <div className="text-center space-y-4">
                    <Icon name="Zap" className="text-accent mx-auto" size={80} />
                    <h2 className="text-4xl font-black text-white">GAME OVER</h2>
                    <div className="space-y-2">
                      <p className="text-2xl text-white font-bold">Score: {score}</p>
                      {score === highScore && score > 0 && (
                        <p className="text-xl text-accent font-bold animate-bounce-bird">
                          🎉 NEW HIGH SCORE! 🎉
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Button
                      onClick={startGame}
                      size="lg"
                      className="bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 text-white font-bold text-xl px-8 py-6 rounded-full shadow-lg shadow-primary/50 transition-all duration-300 hover:scale-105"
                    >
                      <Icon name="RotateCcw" className="mr-2" size={24} />
                      PLAY AGAIN
                    </Button>
                    <Button
                      onClick={resetGame}
                      size="lg"
                      variant="outline"
                      className="border-2 border-white/30 text-white hover:bg-white/10 font-bold text-xl px-8 py-6 rounded-full transition-all duration-300 hover:scale-105"
                    >
                      <Icon name="Home" className="mr-2" size={24} />
                      MENU
                    </Button>
                  </div>
                </div>
              )}

              {gameStarted && !gameOver && (
                <>
                  <div
                    className="absolute w-[50px] h-[50px] transition-all duration-100"
                    style={{
                      left: '100px',
                      top: `${bird.y}px`,
                      transform: `rotate(${Math.min(bird.velocity * 3, 30)}deg)`
                    }}
                  >
                    <Icon name="Rocket" className="text-accent drop-shadow-[0_0_10px_rgba(255,107,157,0.8)]" size={50} />
                  </div>

                  {obstacles.map((obs, idx) => (
                    <div key={idx}>
                      <div
                        className="absolute bg-gradient-to-r from-primary/80 to-secondary/80 border-2 border-white/20 rounded-lg shadow-lg shadow-primary/30"
                        style={{
                          left: `${obs.x}px`,
                          top: 0,
                          width: `${OBSTACLE_WIDTH}px`,
                          height: `${obs.gapY}px`
                        }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Icon name="Moon" className="text-white/40 animate-float" size={40} />
                        </div>
                      </div>
                      <div
                        className="absolute bg-gradient-to-r from-primary/80 to-secondary/80 border-2 border-white/20 rounded-lg shadow-lg shadow-primary/30"
                        style={{
                          left: `${obs.x}px`,
                          top: `${obs.gapY + GAP_SIZE}px`,
                          width: `${OBSTACLE_WIDTH}px`,
                          height: `${600 - (obs.gapY + GAP_SIZE)}px`
                        }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Icon name="Moon" className="text-white/40 animate-float" size={40} />
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-primary to-secondary" />
            </div>
          </Card>
        </div>

        <div className="text-center mt-8 text-white/60">
          <p className="text-sm">Use SPACE or CLICK to control your rocket</p>
        </div>
      </div>
    </div>
  );
};

export default Index;