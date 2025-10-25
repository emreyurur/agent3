import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Injectable } from '@nestjs/common';
import { SuiService } from '../sui/sui.service';
import { CreateAgentDto } from './dto/create-agent-dto';
import { DbService } from 'src/db/db.service';
import multer from 'multer';

@Injectable()
export class BuilderService {
  private readonly PACKAGE_ID = process.env.PACKAGE_ID!;
  private readonly MODULE_NAME = 'credit_system';
  logger: any;

  constructor(
    private readonly suiService: SuiService,
    private readonly db: DbService,
  ) {}

  /**
   * Agent olarak kayıt olmak için işlem hazırlar
   * @param callerAddress Kayıt olmak isteyen adres
   * @param agentName Agent'ın adı
   * @param agentUrl Agent'ın URL'si
   * @returns İmzalanmak üzere hazırlanmış işlem
   */
  async registerAsAgent(file: Express.Multer.File, body: CreateAgentDto) {
    const client = this.suiService.getClient();
    const tx = new TransactionBlock();

    const FUNCTION_NAME = 'register_as_agent';

    // String'leri byte array'e dönüştür
    const nameBytes = Array.from(new TextEncoder().encode(body.name));
    const urlBytes = Array.from(new TextEncoder().encode(body.endpoint));

    tx.moveCall({
      target: `${this.PACKAGE_ID}::${this.MODULE_NAME}::${FUNCTION_NAME}`,
      arguments: [
        tx.object(process.env.CREDIT_SYSTEM_ID!),
        tx.pure(nameBytes),
        tx.pure(urlBytes),
      ],
    });

    tx.setSender(body.walletAddress);

    const txBytes = await tx.build({ client });
    const imageBuffer = file.buffer;
    const agent = await this.db.agent.create({
      data: {
        name: body.name,
        endpoint: body.endpoint,
        walletAddress: body.walletAddress,
        credit: +body.credit,
        categoryName: body.categoryName,
        description: body.description,
        inputSchema: body.inputSchema,
        outputSchema: body.outputSchema,
        image: 'agents/' + file.filename,
      },
    });
    console.log(`Transaction bytes for registerAsAgent: ${txBytes}`);
    console.log(`New agent created in DB with ID: ${agent.id}`);
    return {
      txBytes: Buffer.from(txBytes).toString('base64'),
      message: 'Agent kayıt işlemi hazırlandı. Cüzdanınızla imzalayın.',
    };
  }

  /**
   * Agent sahibi olarak birikmiş geliri çekmek için işlem hazırlar
   * @param callerAddress Agent sahibinin adresi
   * @param agentId Agent ID
   * @returns İmzalanmak üzere hazırlanmış işlem
   */
  async agentWithdrawRevenue(callerAddress: string, agentId: number) {
    const client = this.suiService.getClient();
    const tx = new TransactionBlock();

    const FUNCTION_NAME = 'agent_withdraw_revenue';

    tx.moveCall({
      target: `${this.PACKAGE_ID}::${this.MODULE_NAME}::${FUNCTION_NAME}`,
      arguments: [
        tx.object(process.env.CREDIT_SYSTEM_ID!),
        tx.pure(String(agentId)),
      ],
    });

    tx.setSender(callerAddress);

    const txBytes = await tx.build({ client });

    return {
      txBytes: Buffer.from(txBytes).toString('base64'),
      message: 'Agent gelir çekme işlemi hazırlandı. Cüzdanınızla imzalayın.',
    };
  }

  /**
   * Agent sahipliğini başka bir adrese devretmek için işlem hazırlar
   * @param callerAddress Mevcut agent sahibi adresi
   * @param agentId Agent ID
   * @param newOwnerAddress Yeni sahip adresi
   * @returns İmzalanmak üzere hazırlanmış işlem
   */
  async transferAgentOwnership(
    callerAddress: string,
    agentId: number,
    newOwnerAddress: string,
  ) {
    const client = this.suiService.getClient();
    const tx = new TransactionBlock();

    const FUNCTION_NAME = 'transfer_agent_ownership';

    tx.moveCall({
      target: `${this.PACKAGE_ID}::${this.MODULE_NAME}::${FUNCTION_NAME}`,
      arguments: [
        tx.object(process.env.CREDIT_SYSTEM_ID!),
        tx.pure(String(agentId)),
        tx.pure(newOwnerAddress),
      ],
    });

    tx.setSender(callerAddress);

    const txBytes = await tx.build({ client });
    const agent = await this.db.agent.update({
      where: { id: agentId },
      data: { walletAddress: newOwnerAddress },
    });
    return {
      txBytes: Buffer.from(txBytes).toString('base64'),
      message:
        'Agent sahiplik devri işlemi hazırlandı. Cüzdanınızla imzalayın.',
    };
  }

  /**
   * Agent'ı silmek için işlem hazırlar (geliri 0 olmalı)
   * @param callerAddress Agent sahibinin adresi
   * @param agentId Agent ID
   * @returns İmzalanmak üzere hazırlanmış işlem
   */
  async removeAgent(callerAddress: string, agentId: number) {
    const client = this.suiService.getClient();
    const tx = new TransactionBlock();

    const FUNCTION_NAME = 'remove_agent';

    tx.moveCall({
      target: `${this.PACKAGE_ID}::${this.MODULE_NAME}::${FUNCTION_NAME}`,
      arguments: [
        tx.object(process.env.CREDIT_SYSTEM_ID!),
        tx.pure(String(agentId)),
      ],
    });

    tx.setSender(callerAddress);

    const txBytes = await tx.build({ client });
    const agent = await this.db.agent.delete({
      where: { id: agentId },
    });
    return {
      txBytes: Buffer.from(txBytes).toString('base64'),
      message: 'Agent silme işlemi hazırlandı. Cüzdanınızla imzalayın.',
    };
  }

  /**
   * Tüm agent'ları listelemek için işlem hazırlar
   * @param senderAddress İşlemi gönderecek adres
   * @returns İmzalanmak üzere hazırlanmış işlem
   */
  async getAgentsTx(senderAddress: string) {
    const client = this.suiService.getClient();
    const tx = new TransactionBlock();
    const FUNCTION_NAME = 'get_agents_entry';

    tx.moveCall({
      target: `${this.PACKAGE_ID}::${this.MODULE_NAME}::${FUNCTION_NAME}`,
      arguments: [tx.object(process.env.CREDIT_SYSTEM_ID!)],
    });

    tx.setSender(senderAddress);
    const txBytes = await tx.build({ client });
    return {
      txBytes: Buffer.from(txBytes).toString('base64'),
      message: 'get_agents_entry tx prepared (emit AgentsEvent).',
    };
  }

  /**
   * Tüm agent'ları doğrudan almak için devInspect kullanır
   * @returns Agent listesi veya hata mesajı
   */
  async getAgents(senderAddress: string) {
    const agents = await this.db.agent.findMany({
      where: { walletAddress: senderAddress },
      select: {
        id: true,
        name: true,
        endpoint: true,
        walletAddress: true,
        credit: true,
        categoryName: true,
        description: true,
        inputSchema: true,
        outputSchema: true,
        image: true,
      },
    });
    console.log(`Found ${agents.length} agents for address ${senderAddress}`);
    const enrichedAgents = agents.map((agent) => ({
      ...agent,
      // walletAddress zaten string olduğu için dönüştürmeye gerek yok
      id: Number(agent.id),
      credit: Number(agent.credit), // BigInt yerine Number kullanıyoruz
    }));
    return enrichedAgents;
  }
}
