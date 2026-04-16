package com.familycal.repository;

import com.familycal.domain.GroupMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {

    boolean existsByUserIdAndFamilyGroupId(Long userId, Long familyGroupId);

    Optional<GroupMember> findByUserIdAndFamilyGroupId(Long userId, Long familyGroupId);

    @Query("select gm.familyGroup.id from GroupMember gm where gm.user.id = :userId")
    List<Long> findGroupIdsByUserId(@Param("userId") Long userId);
}
