migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'bianca@bener.com.br')
    } catch (_) {
      const admin = new Record(users)
      admin.setEmail('bianca@bener.com.br')
      admin.setPassword('Skip@Pass')
      admin.setVerified(true)
      admin.set('name', 'Bianca')
      app.save(admin)
    }

    const clientesData = [
      {
        fantasia: '# CBC',
        contato: 'Marcus Vinicius s',
        telefone: '(11) 2139-8379',
        celular: '',
        email: 'vinicius@cbc.com.br',
        dt_cad: '26/09/2024',
        status: 'Ativo',
      },
      {
        fantasia: '# DURATEX',
        contato: 'JAIR ROGERIO',
        telefone: '(11) 99685-0586',
        celular: '',
        email: 'jair.antonio@dex.co',
        dt_cad: '11/10/2019',
        status: 'Ativo',
      },
      {
        fantasia: '#FERRAMENTARIA REIS',
        contato: 'Adriano Moreira Reis',
        telefone: '(11) 3494-9756',
        celular: '(11) 97437-4025',
        email: 'adriano1284reis@gmail.com',
        dt_cad: '26/04/2024',
        status: 'Ativo',
      },
      {
        fantasia: '#IND. MEC. JF',
        contato: 'Rafael Capraro',
        telefone: '(11) 2951-4709',
        celular: '(11) 98226-7383',
        email: 'rafael@jf.ind.br',
        dt_cad: '04/04/2024',
        status: 'Ativo',
      },
      {
        fantasia: '#METALTORK',
        contato: 'Leandro Pereira',
        telefone: '(11) 4070-5638',
        celular: '(11) 97129-1075',
        email: 'leandro.pereira@metaltork.com.br',
        dt_cad: '30/08/2024',
        status: 'Ativo',
      },
    ]

    const colClientes = app.findCollectionByNameOrId('clientes')
    for (const item of clientesData) {
      try {
        app.findFirstRecordByData('clientes', 'fantasia', item.fantasia)
      } catch (_) {
        const rec = new Record(colClientes)
        Object.entries(item).forEach(([k, v]) => rec.set(k, v))
        app.save(rec)
      }
    }

    const repData = [
      {
        fantasia: 'Marcus Melo',
        sigla: 'ABSTR',
        telefone: '(49) 9959-0384',
        cidade: '',
        uf: '',
        dt_cad: '20/03/2025',
        status: 'Ativo',
      },
      {
        fantasia: 'GOIÁS CENTRAL ENGENHARIA',
        sigla: 'AIRES',
        telefone: '(62) 99394-6310',
        cidade: 'Goiânia',
        uf: 'GO',
        dt_cad: '11/11/2020',
        status: 'Ativo',
      },
      {
        fantasia: 'Aline',
        sigla: 'ALINE',
        telefone: '(55) 19999-371337',
        cidade: '',
        uf: '',
        dt_cad: '12/03/2025',
        status: 'Ativo',
      },
      {
        fantasia: 'AMAZONTEC REPRESENTAÇÕES',
        sigla: 'AMAZO',
        telefone: '(92) 9142-3707',
        cidade: 'Manaus',
        uf: 'AM',
        dt_cad: '09/06/2014',
        status: 'Ativo',
      },
      {
        fantasia: 'RECIFE MAQUINAS',
        sigla: 'AMPLA',
        telefone: '(81) 99634-6050',
        cidade: 'Recife',
        uf: 'PE',
        dt_cad: '09/07/2014',
        status: 'Ativo',
      },
    ]

    const colRep = app.findCollectionByNameOrId('representantes')
    for (const item of repData) {
      try {
        app.findFirstRecordByData('representantes', 'fantasia', item.fantasia)
      } catch (_) {
        const rec = new Record(colRep)
        Object.entries(item).forEach(([k, v]) => rec.set(k, v))
        app.save(rec)
      }
    }

    const prepData = [
      {
        representante: 'BENER - Bener Comercial Importadora Exportadora Ltda',
        nome: 'Bener - Bener Comercial Imp. Exp. Ltda',
        email: '',
        telefone: '',
        dt_cad: '01/10/2015',
      },
      {
        representante: 'EBMAQ - EBMAQ COMÉRCIO DE MÁQUINAS LTDA ME - Almeida',
        nome: 'Almeida',
        email: 'vds.almeida@terra.com.br',
        telefone: '(11) 95798-0000',
        dt_cad: '30/05/2014',
      },
      {
        representante: 'TECN1 - TECNOVERKAUF 1',
        nome: 'Mauricio Fonseca',
        email: 'tecnoverkauf@uol.com.br',
        telefone: '(11) 99906-2274',
        dt_cad: '30/05/2014',
      },
      {
        representante: 'CMTEC - CMTEC MÁQUINAS OPERATRIZES LTDA.',
        nome: 'Caito',
        email: 'caito@cmtecmaquinas.com.br',
        telefone: '(14) 99772-6717',
        dt_cad: '21/05/2014',
      },
      {
        representante: 'TIAGO - TIAGO SAVIOLI',
        nome: 'Tiago Savioli',
        email: 'tiago@bener.com.br',
        telefone: '(15) 7814-2602',
        dt_cad: '21/05/2014',
      },
    ]

    const colPrep = app.findCollectionByNameOrId('prepostos')
    for (const item of prepData) {
      try {
        app.findFirstRecordByData('prepostos', 'representante', item.representante)
      } catch (_) {
        const rec = new Record(colPrep)
        Object.entries(item).forEach(([k, v]) => rec.set(k, v))
        app.save(rec)
      }
    }
  },
  (app) => {},
)
