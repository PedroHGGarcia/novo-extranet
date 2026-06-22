migrate(
  (app) => {
    const clientesData = [
      {
        fantasia: 'A.M. FERNANDES',
        contato: 'A.M. FERNANDES',
        telefone: '(11) 2218-0909',
        celular: '',
        email: 'alexandre@amfernandes.com.br',
        dt_cad: '11/08/2005',
        status: 'Ativo',
      },
      {
        fantasia: 'ABREU JUNIOR',
        contato: 'AILTON ALVES DE ABREU JUNIOR',
        telefone: '(11) 94827-0209',
        celular: '',
        email: 'adm.ajmanutencao@gmail.com',
        dt_cad: '24/09/2024',
        status: 'Ativo',
      },
      {
        fantasia: 'A.A.D',
        contato: 'JUSCELINO LISBOA',
        telefone: '(11) 2201-9252',
        celular: '',
        email: 'agad.sp@uol.com.br',
        dt_cad: '12/04/2017',
        status: 'Ativo',
      },
      {
        fantasia: 'A&A USINAGEM',
        contato: '',
        telefone: '(11) 2261-2661',
        celular: '',
        email: 'usinagem@aausinagem.com.br',
        dt_cad: '08/04/2021',
        status: 'Ativo',
      },
      {
        fantasia: 'Ajax Usinagem',
        contato: 'Willian Barbosa',
        telefone: '(11) 2038-0382',
        celular: '',
        email: 'ajax@ajaxusinagem.com.br',
        dt_cad: '15/05/2012',
        status: 'Ativo',
      },
      {
        fantasia: 'AM de Jesus',
        contato: 'Anderson de Jesus',
        telefone: '(11) 5560-6316',
        celular: '',
        email: 'amusinagem@gmail.com',
        dt_cad: '26/05/2021',
        status: 'Ativo',
      },
      {
        fantasia: 'AM ROSAS',
        contato: 'MARCOS A. C. DA SILVA',
        telefone: '(11) 2414-3836',
        celular: '',
        email: 'marcos.vendas@amrosas.com.br',
        dt_cad: '01/03/2005',
        status: 'Ativo',
      },
      {
        fantasia: 'AM USINAGEM',
        contato: 'CARLOS DE SOUZA',
        telefone: '(11) 2011-8041',
        celular: '',
        email: 'aplasmoldes@aplasmoldes.com.br',
        dt_cad: '17/04/1998',
        status: 'Ativo',
      },
      {
        fantasia: 'A P USINAGEM',
        contato: 'ORIDES E ALEXANDRE',
        telefone: '(11) 2086-0683',
        celular: '',
        email: 'orides.apusinagem@bol.com.br',
        dt_cad: '24/03/2011',
        status: 'Ativo',
      },
      {
        fantasia: 'A R COMERCIAL',
        contato: 'SR. ARLINDO',
        telefone: '(11) 2631-0164',
        celular: '',
        email: 'vendas@arcomercial.com.br',
        dt_cad: '09/06/2005',
        status: 'Ativo',
      },
      {
        fantasia: 'ABMAQ',
        contato: 'Milton Ribeiro',
        telefone: '(11) 2015-1828',
        celular: '',
        email: 'b.j.ferramentas@ig.com.br',
        dt_cad: '12/08/2004',
        status: 'Ativo',
      },
    ]

    const colClientes = app.findCollectionByNameOrId('clientes')
    for (const item of clientesData) {
      let exists = false
      try {
        app.findFirstRecordByData('clientes', 'fantasia', item.fantasia)
        exists = true
      } catch (_) {}

      if (!exists && item.email) {
        try {
          app.findFirstRecordByData('clientes', 'email', item.email)
          exists = true
        } catch (_) {}
      }

      if (!exists) {
        const rec = new Record(colClientes)
        Object.entries(item).forEach(([k, v]) => rec.set(k, v))
        app.save(rec)
      }
    }
  },
  (app) => {
    // Optional down migration
  },
)
