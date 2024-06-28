import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { CreateBuildingDto } from './dto/create-building.dto';
import { UpdateBuildingDto } from './dto/update-building.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Building } from './entities/building.entity';
import { Repository } from 'typeorm';
import { CreateWorkflowDto } from '@app/workflows';
import { WORKFLOWS_SERVICE } from '../constans';
import { Client } from '@nestjs/microservices/external/nats-client.interface';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class BuildingsService {
  private readonly logger = new Logger(BuildingsService.name);
  constructor(
    @InjectRepository(Building)
    private readonly buildingRepository: Repository<Building>,
    @Inject(WORKFLOWS_SERVICE)
    private readonly workFlowsService: ClientProxy,
  ) {}

  async findAll(): Promise<Building[]> {
    return await this.buildingRepository.find();
  }

  async findOne(id: number): Promise<Building> {
    const building = await this.buildingRepository.findOne({
      where: { id: id },
    });

    if (!building) {
      throw new NotFoundException(`Building with id ${id} not found`);
    }

    return building;
  }

  async create(createBuildingDto: CreateBuildingDto): Promise<Building> {
    const building = this.buildingRepository.create({
      ...createBuildingDto,
    });
    const newBuilding = await this.buildingRepository.save(building);
    console.log({ newBuilding });
    await this.createWorkflow(newBuilding);
    return newBuilding;
  }

  async update(
    id: number,
    updateBuildingDto: UpdateBuildingDto,
  ): Promise<Building> {
    const building = await this.buildingRepository.preload({
      id: +id,
      ...updateBuildingDto,
    });
    if (!building) {
      throw new NotFoundException(`Building with id ${id} not found`);
    }
    return await this.buildingRepository.save(building);
  }

  async remove(id: number): Promise<Building> {
    const building = await this.findOne(id);
    return this.buildingRepository.remove(building);
  }

  async createWorkflow(building: Building) {
    console.log(
      'Building Service - Creating workflow for building',
      building.id,
    );
    try {
      this.logger.log('Sending message to workflows.create queue');
      const newWorkflow = await lastValueFrom(
        this.workFlowsService.send('workflows.create', {
          name: building.name,
          buildingId: building.id,
        } as CreateWorkflowDto),
      );
      this.logger.debug('Received response from workflows.create queue', {
        newWorkflow,
      });
      return newWorkflow;
    } catch (error) {
      this.logger.error('Error while creating workflow', error.message);
      throw error;
    }
  }
}
