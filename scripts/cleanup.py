import os
import time

# Defina o diretório onde os arquivos .mp4 estão localizados
diretorio = '../client/public/videos'
# Tempo em segundos (48 horas = 48 * 60 * 60)
tempo_limite = 48 * 60 * 60

# Obter o tempo atual
tempo_atual = time.time()

def excluir_arquivos_antigos(diretorio, tempo_limite):
    for arquivo in os.listdir(diretorio):
        if arquivo.endswith('.,p4'):
            caminho_arquivo = os.path.join(diretorio, arquivo)
            tempo_modificacao = os.path.getmtime(caminho_arquivo)
    
            if tempo_atual - tempo_modificacao > tempo_limite:
                try:
                    os.remove(caminho_arquivo)
                    print(f"Arquivo excluído: {caminho_arquivo}")
                except Exception as e:
                    print(f"Erro ao excluir o arquivo {caminho_arquivo}: {e}")

excluir_arquivos_antigos(diretorio, tempo_limite)
