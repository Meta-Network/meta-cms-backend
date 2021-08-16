import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GitHubStorageProviderEntity } from 'src/entities/provider/storage/github.entity';
import { DeleteResult, Repository } from 'typeorm';

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
    oldS: GitHubStorageProviderEntity,
    newS: GitHubStorageProviderEntity,
  ): Promise<GitHubStorageProviderEntity> {
    const storage = this.storageRepository.merge(oldS, newS);
    return await this.storageRepository.save(storage);
  }

  async delete(cid: number): Promise<DeleteResult> {
    return await this.storageRepository.delete(cid);
  }
}
