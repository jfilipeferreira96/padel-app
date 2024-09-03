import pymysql

db_config = {
    'host': 'seu_host',
    'port': 3306,  
    'user': 'seu_usuario',
    'password': 'sua_senha',
    'database': 'seu_banco_de_dados'
}

# Função para atualizar o status para 'completed'
def success(row_id):
    try:
        # Conectando ao banco de dados
        conexao = pymysql.connect(**db_config)
        cursor = conexao.cursor()
        
        # Executando a query de atualização
        cursor.execute("UPDATE videos_processed SET status = 'completed', error_message = NULL WHERE id = %s", (row_id,))
        conexao.commit()
        
        print(f"ID {row_id}: Status atualizado para 'completed'.")
    except Exception as e:
        print(f"Erro ao atualizar status para 'completed': {e}")
    finally:
        # Fechando a conexão
        if conexao:
            cursor.close()
            conexao.close()

# Função para atualizar o status para 'failed' e definir a mensagem de erro
def failed(row_id, erro_msg):
    try:
        # Conectando ao banco de dados
        conexao = pymysql.connect(**db_config)
        cursor = conexao.cursor()
        
        # Executando a query de atualização
        cursor.execute("UPDATE videos_processed SET status = 'failed', error_message = %s WHERE id = %s", (erro_msg, row_id))
        conexao.commit()
        
        print(f"ID {row_id}: Status atualizado para 'failed' com mensagem de erro.")
    except Exception as e:
        print(f"Erro ao atualizar status para 'failed': {e}")
    finally:
        # Fechando a conexão
        if conexao:
            cursor.close()
            conexao.close()

# Função para atualizar o status para 'error' e definir a mensagem de erro
def error(row_id, erro_msg):
    try:
        # Conectando ao banco de dados
        conexao = pymysql.connect(**db_config)
        cursor = conexao.cursor()
        
        # Executando a query de atualização
        cursor.execute("UPDATE videos_processed SET status = 'error', error_message = %s WHERE id = %s", (erro_msg, row_id))
        conexao.commit()
        
        print(f"ID {row_id}: Status atualizado para 'error' com mensagem de erro.")
    except Exception as e:
        print(f"Erro ao atualizar status para 'error': {e}")
    finally:
        # Fechando a conexão
        if conexao:
            cursor.close()
            conexao.close()
