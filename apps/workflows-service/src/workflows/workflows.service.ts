import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateWorkflowDto, UpdateWorkflowDto } from '@app/workflows';
import { InjectRepository } from '@nestjs/typeorm';
import { Workflow } from './entities/workflow.entity';
import { Repository } from 'typeorm';

@Injectable()
export class WorkflowsService {
  private readonly logger = new Logger(WorkflowsService.name);

  constructor(
    @InjectRepository(Workflow)
    private workflowRepository: Repository<Workflow>,
  ) {}

  async findAll(): Promise<Workflow[]> {
    return await this.workflowRepository.find();
  }

  async findOne(id: number): Promise<Workflow> {
    const workflow = await this.workflowRepository.findOne({
      where: { id: id },
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with id ${id} not found`);
    }

    return workflow;
  }

  async create(createWorkflowDto: CreateWorkflowDto): Promise<Workflow> {
    const workflow = this.workflowRepository.create({
      ...createWorkflowDto,
    });
    const newWorkflowEntity = await this.workflowRepository.save(workflow);
    this.logger.debug(
      `Creating workflow with id ${newWorkflowEntity.id} for building ${newWorkflowEntity.buildingId}`,
    );
    return newWorkflowEntity;
  }

  async update(
    id: number,
    updateWorkflowDto: UpdateWorkflowDto,
  ): Promise<Workflow> {
    const workflow = await this.workflowRepository.preload({
      id: +id,
      ...updateWorkflowDto,
    });
    if (!workflow) {
      throw new NotFoundException(`Workflow with id ${id} not found`);
    }
    return await this.workflowRepository.save(workflow);
  }

  async remove(id: number): Promise<Workflow> {
    const workflow = await this.findOne(id);
    return this.workflowRepository.remove(workflow);
  }
}
