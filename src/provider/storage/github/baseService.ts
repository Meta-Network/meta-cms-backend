import { DeleteResult, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GitHubStorageProviderEntity } from '../../../entities/provider/storage/github.entity';

@Injectable()
export class GitHubStorageBaseService {
  constructor(
    @InjectRepository(GitHubStorageProviderEntity)
    private readonly storageRepository: Repository<GitHubStorageProviderEntity>,
  ) {}

  async read(sid: number): Promise<GitHubStorageProviderEntity> {
    return await this.storageRepository.findOne(sid);
  }

  async create(
    storage: GitHubStorageProviderEntity,
  ): Promise<GitHubStorageProviderEntity> {
    const newStorage = this.storageRepository.create(storage);
    return await this.storageRepository.save(newStorage);
  }

  async update(
    storage: GitHubStorageProviderEntity,
  ): Promise<GitHubStorageProviderEntity> {
    return await this.storageRepository.save(storage);
  }

  async delete(cid: number): Promise<DeleteResult> {
    return await this.storageRepository.delete(cid);
  }
}
