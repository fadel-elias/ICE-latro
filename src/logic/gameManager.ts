// GameManager.ts - Gerenciador central do jogo
import GameState from './gameState';

export type GameScene = 'bar-scene' | 'game-board' | 'victory' | 'defeat';

export interface RodadaInfo {
  numero: number;
  metaDePontos: number;
  dificuldade: string;
}

export class GameManager {
  private gameState: GameState | null = null;
  private currentScene: GameScene = 'bar-scene';
  private rodadaAtual: number = 1;
  private callbacks: Map<string, Function[]> = new Map();

  constructor() {
    this.initializeCallbacks();
  }

  private initializeCallbacks() {
    this.callbacks.set('sceneChange', []);
    this.callbacks.set('roundStart', []);
    this.callbacks.set('roundEnd', []);
    this.callbacks.set('victory', []);
    this.callbacks.set('defeat', []);
  }

  // Registrar callbacks para eventos
  on(event: string, callback: Function) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)!.push(callback);
  }

  private emit(event: string, data?: any) {
    const eventCallbacks = this.callbacks.get(event) || [];
    eventCallbacks.forEach(callback => callback(data));
  }

  // Inicializar o jogo
  initialize(deck: any[]) {
    this.gameState = new GameState(deck);
    this.currentScene = 'bar-scene';
    this.rodadaAtual = 1;
    console.log('🎮 GameManager inicializado');
  }

  // Mudar de cena
  changeScene(newScene: GameScene) {
    const oldScene = this.currentScene;
    this.currentScene = newScene;
    
    console.log(`🎭 Mudança de cena: ${oldScene} → ${newScene}`);
    this.emit('sceneChange', { from: oldScene, to: newScene });
  }

  // Iniciar nova rodada
  iniciarProximaRodada(): RodadaInfo {
    if (!this.gameState) {
      throw new Error('GameState não inicializado');
    }

    // Dobrar a meta de pontos
    const novaMetaDePontos = this.gameState.getMetaDePontos() * 2;
    
    // Resetar valores
    this.gameState.resetarRodada(novaMetaDePontos);
    
    // Incrementar rodada
    this.rodadaAtual++;
    
    const rodadaInfo: RodadaInfo = {
      numero: this.rodadaAtual,
      metaDePontos: novaMetaDePontos,
      dificuldade: this.getDificuldadeText(this.rodadaAtual)
    };

    console.log('🎲 Nova rodada iniciada:', rodadaInfo);
    this.emit('roundStart', rodadaInfo);
    
    return rodadaInfo;
  }

  private getDificuldadeText(rodada: number): string {
    if (rodada === 1) return 'Iniciante';
    if (rodada === 2) return 'Fácil';
    if (rodada === 3) return 'Médio';
    if (rodada === 4) return 'Difícil';
    if (rodada === 5) return 'Muito Difícil';
    return 'Impossível';
  }

  // Verificar condições de vitória/derrota
  verificarCondicoesJogo(): 'playing' | 'victory' | 'defeat' {
    if (!this.gameState) return 'playing';

    const stats = this.gameState.getEstatisticas();
    
    // Verificar vitória
    if (stats.pontuacaoAtual >= stats.metaDePontos) {
      console.log('🏆 Condição de vitória atingida!');
      this.emit('victory', { 
        rodada: this.rodadaAtual,
        pontuacao: stats.pontuacaoAtual,
        meta: stats.metaDePontos
      });
      return 'victory';
    }
    
    // Verificar derrota
    if (stats.maosRestantes === 0 && stats.pontuacaoAtual < stats.metaDePontos) {
      console.log('💔 Condição de derrota atingida!');
      this.emit('defeat', {
        rodada: this.rodadaAtual,
        pontuacao: stats.pontuacaoAtual,
        meta: stats.metaDePontos
      });
      return 'defeat';
    }
    
    return 'playing';
  }

  // Processar ação do jogador e verificar condições
  processarAcaoJogador(action: string, data?: any): 'continue' | 'victory' | 'defeat' {
    if (!this.gameState) return 'continue';

    // Executar a ação no gameState aqui se necessário
    // (ou deixar que seja feito externamente)

    // Verificar condições após a ação
    const resultado = this.verificarCondicoesJogo();
    
    // Mapear resultado
    if (resultado === 'victory') return 'victory';
    if (resultado === 'defeat') return 'defeat';
    return 'continue';
  }

  // Getters
  getCurrentScene(): GameScene {
    return this.currentScene;
  }

  getRodadaAtual(): number {
    return this.rodadaAtual;
  }

  getGameState(): GameState | null {
    return this.gameState;
  }

  // Reiniciar jogo completamente
  reiniciarJogo(deck: any[]) {
    this.gameState = new GameState(deck);
    this.currentScene = 'bar-scene';
    this.rodadaAtual = 1;
    console.log('🔄 Jogo reiniciado');
  }

  // Continuar para próxima rodada (após vitória)
  continuarParaProximaRodada() {
    const rodadaInfo = this.iniciarProximaRodada();
    this.changeScene('bar-scene'); // Voltar ao bar para diálogo
    return rodadaInfo;
  }

  // Ir para a mesa de jogo
  irParaMesaDeJogo() {
    this.changeScene('game-board');
    
    if (this.gameState) {
      // Inicializar mão com 7 cartas
      this.gameState.inicializarMao(7);
    }
  }
}

// Instância singleton
export const gameManager = new GameManager();

export default GameManager;
