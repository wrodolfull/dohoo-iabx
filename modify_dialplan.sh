#!/bin/bash

# Backup do arquivo original
cp /etc/freeswitch/dialplan/context_merlindesk.xml /etc/freeswitch/dialplan/context_merlindesk.xml.backup

# Adicionar execução do script após cada ring group
sed -i '/<action application="hangup"\/>/a \        <action application="bgapi" data="lua /etc/freeswitch/scripts/survey_after_call_fixed.lua"/>' /etc/freeswitch/dialplan/context_merlindesk.xml

echo "Dialplan modificado com sucesso!"
echo "Ring groups agora executarao o script de pesquisa apos as chamadas"
